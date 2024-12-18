from flask import Blueprint, jsonify, request
from models.token import Token
from models.tweet import Tweet, db
from functools import wraps
from config import Config
from google.cloud import tasks_v2
import tweepy
from clients.openrouter import get_openrouter_client
from datetime import datetime, timedelta
from typing import Optional, Tuple
import json

jobs = Blueprint('jobs', __name__)

def create_cloud_tasks_client():
    """Create a Cloud Tasks client"""
    return tasks_v2.CloudTasksClient()

def create_task_for_token(client, token_address):
    """Create a Cloud Task for processing a specific token"""
    project = Config.GOOGLE_CLOUD_PROJECT
    queue = Config.CLOUD_TASKS_QUEUE
    location = Config.CLOUD_TASKS_LOCATION
    
    parent = client.queue_path(project, location, queue)
    
    task = {
        'http_request': {
            'http_method': tasks_v2.HttpMethod.POST,
            'url': f"{Config.CLOUD_TASKS_HANDLER_URL}/{token_address}",
            'headers': {
                'Content-Type': 'application/json',
                'Authorization': f"Bearer {Config.JOBS_SECRET}"
            }
        }
    }
    
    if Config.SERVICE_ACCOUNT_EMAIL:
        task['http_request']['oidc_token'] = {
            'service_account_email': Config.SERVICE_ACCOUNT_EMAIL,
            'audience': Config.CLOUD_TASKS_HANDLER_URL
        }
    
    return client.create_task(request={'parent': parent, 'task': task})

def require_jobs_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
            
        try:
            _, token = auth_header.split(' ', 1)
            if token != Config.JOBS_SECRET:
                return jsonify({'error': 'Invalid authorization token'}), 401
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': 'Invalid authorization format'}), 401
            
    return decorated

def should_create_tweet(token, tweets_per_day):
    """Check if enough time has passed since last tweet based on tweets_per_day"""
    if tweets_per_day <= 0:
        return False
        
    # Calculate interval between tweets in hours
    interval_hours = 24.0 / tweets_per_day
    
    # Get the last tweet for this token
    last_tweet = Tweet.query.filter_by(token_address=token.address)\
        .order_by(Tweet.created_at.desc())\
        .first()
    
    if not last_tweet:
        return True
        
    # Calculate time since last tweet
    time_since_last = datetime.utcnow() - last_tweet.created_at
    return time_since_last >= timedelta(hours=interval_hours)

def generate_tweet_content(token, thread_id=None):
    """Generate tweet content using AI"""
    max_retries = 3
    current_try = 0
    tweet_content = None
    messages = None
    
    # Get thread content if this is a reply
    thread_content = None
    if thread_id:
        try:
            client = tweepy.Client(
                consumer_key=Config.TWITTER_API_KEY,
                consumer_secret=Config.TWITTER_API_SECRET,
                access_token=token.twitter_oauth_token,
                access_token_secret=token.twitter_oauth_secret
            )
            tweet = client.get_tweet(thread_id)
            if tweet and tweet.data:
                thread_content = tweet.data.text
        except Exception as e:
            print(f"Error fetching thread tweet: {e}")
    
    while current_try < max_retries and not tweet_content:
        current_try += 1
        openrouter_client = get_openrouter_client()
        tweet_content, messages = openrouter_client.generate_tweet(
            token.ai_character,
            thread_id=thread_id,
            thread_content=thread_content
        )
        if tweet_content:
            break
            
    return tweet_content, messages

def post_tweet(token, tweet_content, thread_id=None):
    """Post tweet and save to database"""
    client = tweepy.Client(
        consumer_key=Config.TWITTER_API_KEY,
        consumer_secret=Config.TWITTER_API_SECRET,
        access_token=token.twitter_oauth_token,
        access_token_secret=token.twitter_oauth_secret
    )
    
    # Post the tweet
    if thread_id:
        tweet_response = client.create_tweet(
            text=tweet_content,
            in_reply_to_tweet_id=thread_id
        )
    else:
        tweet_response = client.create_tweet(
            text=tweet_content
        )
    
    # Save to database
    tweet = Tweet(
        tweet_id=str(tweet_response.data['id']),
        messages=messages,
        token_address=token.address,
        model=token.ai_character.get('model', 'anthropic/claude-3-sonnet-20240229'),
        output=tweet_content,
        in_reply_to=thread_id,
        created_at=datetime.utcnow()
    )
    db.session.add(tweet)
    db.session.commit()
    
    return tweet, tweet_response

def create_tweet(token):
    """Create and post a new tweet if it's time"""
    if not token.ai_character:
        raise ValueError(f'Token {token.address} missing AI character configuration')
        
    tweets_per_day = token.ai_character.get('tweets_per_day', 24)
    
    if not should_create_tweet(token, tweets_per_day):
        return None, "Not time for new tweet yet"
        
    tweet_content, messages = generate_tweet_content(token)
    if not tweet_content:
        raise ValueError('Failed to generate tweet content')
        
    tweet, tweet_response = post_tweet(token, tweet_content)
    return tweet, None

def should_respond_to_mention(token, mention_text: str) -> Tuple[bool, Optional[str]]:
    """Have the AI agent decide whether to respond to a mention"""
    
    # Get mention_response setting, defaulting to agent_decides
    mention_response = token.ai_character.get('mention_response', 'agent_decides')
    
    # If configured to never respond
    if mention_response == 'no_response':
        return False, "Mentions disabled for this token"
        
    # If configured to always respond
    if mention_response == 'always_respond':
        return True, None
        
    # For agent_decides (default case)
    if mention_response == 'agent_decides':
        openrouter_client = get_openrouter_client()
        
        # Create a structured prompt for the AI
        system_prompt = {
            "role": "system",
            "content": """You are an AI helping decide whether to respond to a Twitter mention.
            Analyze the mention and return a JSON object with:
            {
                "should_respond": boolean,
                "reason": string
            }
            Only respond if it makes sense to respond in the context of the mention."""
        }
        
        user_prompt = {
            "role": "user",
            "content": f"""As {token.ai_character.get('name', 'the token')}, 
            should you respond to this mention?: {mention_text}
            
            Return only valid JSON."""
        }
        
        try:
            response = openrouter_client.chat.completions.create(
                model=token.ai_character.get('model', 'anthropic/claude-3-sonnet-20240229'),
                messages=[system_prompt, user_prompt],
                response_format={ "type": "json_object" }
            )
            
            result = json.loads(response.choices[0].message.content)
            return result["should_respond"], result["reason"]
            
        except Exception as e:
            print(f"Error in should_respond_to_mention: {e}")
            return False, f"Error determining response: {str(e)}"
            
    return False, f"Invalid mention_response configuration: {mention_response}"

def handle_mentions(token):
    """Handle mentions for the token's Twitter account"""
    # Get mention_response setting, defaulting to agent_decides
    mention_response = token.ai_character.get('mention_response', 'agent_decides')
    
    # Skip if mentions are disabled
    if mention_response == 'no_response':
        return []
        
    if not token.twitter_oauth_token or not token.twitter_oauth_secret:
        raise ValueError(f'Token {token.address} missing Twitter credentials')
        
    client = tweepy.Client(
        consumer_key=Config.TWITTER_API_KEY,
        consumer_secret=Config.TWITTER_API_SECRET,
        access_token=token.twitter_oauth_token,
        access_token_secret=token.twitter_oauth_secret
    )
    
    # Get user's ID
    me = client.get_me()
    user_id = me.data.id
    
    # Get mentions
    mentions = client.get_users_mentions(
        user_id,
        max_results=100,
        tweet_fields=['conversation_id', 'text']
    )
    
    responses = []
    for mention in mentions.data or []:
        # Check if we've already replied to this mention
        existing_reply = Tweet.query.filter_by(
            in_reply_to=mention.id
        ).first()
        
        if existing_reply:
            continue
            
        # Determine if we should respond
        should_respond, reason = should_respond_to_mention(token, mention.text)
        
        if not should_respond:
            print(f"Skipping mention {mention.id}: {reason}")
            continue
            
        # Generate and post reply
        tweet_content, messages = generate_tweet_content(token, thread_id=mention.id)
        if tweet_content:
            tweet, tweet_response = post_tweet(token, tweet_content, thread_id=mention.id)
            responses.append(tweet)
            
    return responses

def is_token_allowed(token_address):
    """Check if token is allowed based on whitelist"""
    whitelist = Config.JOBS_TOKEN_WHITELIST
    return '*' in whitelist or token_address.lower() in [addr.lower() for addr in whitelist]

@jobs.route('/jobs/handle-token/<address>', methods=['POST'])
@require_jobs_auth
def handle_token(address):
    try:
        token = Token.query.filter_by(address=address.lower()).first()
        if not token:
            return jsonify({
                'status': 'error',
                'message': f'Token {address} not found'
            }), 404
            
        if not is_token_allowed(address):
            return jsonify({
                'status': 'error',
                'message': f'Token {address} not whitelisted for jobs'
            }), 403

        results = {
            'new_tweet': None,
            'mention_responses': [],
            'errors': []
        }
        
        # Try to create a new tweet
        try:
            tweet, message = create_tweet(token)
            if tweet:
                results['new_tweet'] = tweet.to_dict()
            elif message:
                results['errors'].append(message)
        except Exception as e:
            results['errors'].append(f'Tweet creation failed: {str(e)}')
        
        # Try to handle mentions
        try:
            responses = handle_mentions(token)
            results['mention_responses'] = [r.to_dict() for r in responses]
        except Exception as e:
            results['errors'].append(f'Mention handling failed: {str(e)}')
        
        return jsonify({
            'status': 'success',
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@jobs.route('/jobs/tweet/<address>', methods=['POST'])
@require_jobs_auth
def generate_and_tweet(address):
    try:
        if not is_token_allowed(address):
            return jsonify({
                'status': 'error',
                'message': f'Token {address} not whitelisted for jobs'
            }), 403

        data = request.get_json() or {}
        thread_id = data.get('thread_id')
        
        token = Token.query.filter_by(address=address.lower()).first()
        if not token:
            return jsonify({
                'status': 'error',
                'message': f'Token {address} not found'
            }), 404
            
        tweet_content, messages = generate_tweet_content(token, thread_id)
        if not tweet_content:
            return jsonify({
                'status': 'error',
                'message': 'Failed to generate tweet content'
            }), 500
            
        tweet, tweet_response = post_tweet(token, tweet_content, thread_id)
        
        return jsonify({
            'status': 'success',
            'tweet': tweet.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@jobs.route('/jobs/tweet/get/<tweet_id>', methods=['GET'])
def get_tweet(tweet_id):
    try:
        tweet = Tweet.query.filter_by(tweet_id=tweet_id).first()
        
        if not tweet:
            return jsonify({
                'status': 'error',
                'message': f'Tweet {tweet_id} not found in database'
            }), 404

        return jsonify({
            'status': 'success',
            'tweet': {
                'id': tweet.tweet_id,
                'text': tweet.output,
                'in_reply_to': tweet.in_reply_to,
                'generation': {
                    'messages': tweet.messages,
                    'model': tweet.model
                },
                'db_record': tweet.to_dict()
            }
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@jobs.route('/jobs/pull-all-tokens', methods=['GET'])
@require_jobs_auth
def pull_all_tokens():
    """
    Pull all tokens that have Twitter OAuth credentials and create Cloud Tasks for each
    """
    print("🔵 Starting pull_all_tokens...")
    try:
        # Query tokens with Twitter OAuth credentials
        tokens = Token.query.filter(
            Token.twitter_oauth_token.isnot(None),
            Token.twitter_oauth_secret.isnot(None)
        ).all()
        print(f"📊 Found {len(tokens)} tokens with Twitter credentials")
        
        # Create Cloud Tasks client
        client = create_cloud_tasks_client()
        
        tasks_created = []
        failed_tokens = []
        
        # Create a task for each token
        for token in tokens:
            try:
                print(f"🎯 Processing token: {token.address}")
                task = create_task_for_token(client, token.address)
                tasks_created.append({
                    'token_address': token.address,
                    'task_name': task.name
                })
                print(f"✅ Successfully created task for token: {token.address}")
            except Exception as e:
                print(f"❌ Failed to create task for token {token.address}: {str(e)}")
                failed_tokens.append({
                    'token_address': token.address,
                    'error': str(e)
                })
        
        print(f"📈 Task creation complete. Success: {len(tasks_created)}, Failed: {len(failed_tokens)}")
        return jsonify({
            'status': 'success',
            'total_tokens': len(tokens),
            'tasks_created': tasks_created,
            'failed_tokens': failed_tokens
        })
        
    except Exception as e:
        print(f"❌ Error in pull_all_tokens: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500