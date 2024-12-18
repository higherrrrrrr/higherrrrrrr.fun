from flask import Blueprint, jsonify, request
from models.token import Token
from flask import current_app
from functools import wraps
import logging
from config import Config
from google.cloud import tasks_v2
from google.protobuf import duration_pb2
import json
import datetime
from clients.openrouter import get_openrouter_client
from models.tweet import Tweet  # Add this import at the top
import tweepy  # Add this import at the top

jobs = Blueprint('jobs', __name__)

def create_cloud_tasks_client():
    """Create a Cloud Tasks client"""
    print("🔵 Creating Cloud Tasks client...")
    client = tasks_v2.CloudTasksClient()
    print("✅ Cloud Tasks client created successfully")
    return client

def create_task_for_token(client, token_address):
    """Create a Cloud Task for processing a specific token"""
    print(f"🔵 Creating task for token: {token_address}")
    project = Config.GOOGLE_CLOUD_PROJECT
    queue = Config.CLOUD_TASKS_QUEUE
    location = Config.CLOUD_TASKS_LOCATION
    
    parent = client.queue_path(project, location, queue)
    print(f"📍 Using queue path: {parent}")
    
    # Construct the request body
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
        print(f"🔑 Using service account: {Config.SERVICE_ACCOUNT_EMAIL}")
        task['http_request']['oidc_token'] = {
            'service_account_email': Config.SERVICE_ACCOUNT_EMAIL,
            'audience': Config.CLOUD_TASKS_HANDLER_URL
        }
    
    created_task = client.create_task(request={'parent': parent, 'task': task})
    print(f"✅ Successfully created task: {created_task.name}")
    return created_task

def require_jobs_auth(f):
    """
    Decorator that requires a valid bearer token matching JOBS_SECRET
    Can be used alongside the signature auth decorator
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        print("🔒 Checking jobs authentication...")
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            print("❌ Missing or invalid authorization header")
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
            
        try:
            # Extract the token
            _, token = auth_header.split(' ', 1)
            
            # Check if token matches the jobs secret
            if token != Config.JOBS_SECRET:
                print("❌ Invalid authorization token")
                return jsonify({'error': 'Invalid authorization token'}), 401
            
            print("✅ Jobs authentication successful")
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"❌ Jobs authorization error: {str(e)}")
            return jsonify({'error': 'Invalid authorization format'}), 401
            
    return decorated

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

@jobs.route('/jobs/handle-token/<address>', methods=['POST'])
@require_jobs_auth
def handle_token(address):
    """
    Handle processing for a specific token
    This endpoint will be called by Cloud Tasks
    """
    print(f"🔵 Handling token: {address}")
    try:
        # Get the token from database
        token = Token.query.filter_by(address=address.lower()).first()
        
        if not token:
            print(f"❌ Token not found: {address}")
            return jsonify({
                'status': 'error',
                'message': f'Token {address} not found'
            }), 404
            
        if not token.twitter_oauth_token or not token.twitter_oauth_secret:
            print(f"❌ Token missing Twitter credentials: {address}")
            return jsonify({
                'status': 'error',
                'message': f'Token {address} missing Twitter credentials'
            }), 400
            
        print(f"✅ Successfully processed token: {address}")
        return jsonify({
            'status': 'success',
            'message': f'Processed token {address}',
            'token': token.to_dict()
        })
        
    except Exception as e:
        print(f"❌ Error processing token {address}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@jobs.route('/jobs/tweet/<address>', methods=['POST'])
@require_jobs_auth
def generate_and_tweet(address):
    """
    Generate and post a tweet for a specific token using its AI character configuration
    and Twitter credentials
    """
    print(f"🔵 Generating tweet for token: {address}")
    try:
        # Get request data for optional thread_id
        data = request.get_json() or {}
        thread_id = data.get('thread_id')
        
        # Get the token from database
        token = Token.query.filter_by(address=address.lower()).first()
        
        if not token:
            print(f"❌ Token not found: {address}")
            return jsonify({
                'status': 'error',
                'message': f'Token {address} not found'
            }), 404
            
        if not token.twitter_oauth_token or not token.twitter_oauth_secret:
            print(f"❌ Token missing Twitter credentials: {address}")
            return jsonify({
                'status': 'error',
                'message': f'Token {address} missing Twitter credentials'
            }), 400
            
        if not token.ai_character:
            print(f"❌ Token missing AI character configuration: {address}")
            return jsonify({
                'status': 'error',
                'message': f'Token {address} missing AI character configuration'
            }), 400

        # Generate tweet using OpenRouter
        print("🤖 Generating tweet using AI...")
        openrouter_client = get_openrouter_client()
        tweet_content, messages = openrouter_client.generate_tweet(
            token.ai_character,
            thread_id=thread_id
        )
        
        if not tweet_content:
            print("❌ Failed to generate tweet content")
            return jsonify({
                'status': 'error',
                'message': 'Failed to generate tweet content'
            }), 500

        # Post to Twitter using Tweepy
        print("🐦 Posting to Twitter...")
        client = tweepy.Client(
            consumer_key=Config.TWITTER_API_KEY,
            consumer_secret=Config.TWITTER_API_SECRET,
            access_token=token.twitter_oauth_token,
            access_token_secret=token.twitter_oauth_secret
        )
        
        # Post tweet
        if thread_id:
            tweet_response = client.create_tweet(
                text=tweet_content,
                in_reply_to_tweet_id=thread_id
            )
        else:
            tweet_response = client.create_tweet(
                text=tweet_content
            )
        
        # Save tweet to database
        print("💾 Saving tweet to database...")
        tweet = Tweet(
            tweet_id=str(tweet_response.data['id']),  # Convert to string as Tweepy returns int
            messages=messages,
            token_address=token.address,
            model="anthropic/claude-3-sonnet-20240229",
            output=tweet_content,
            in_reply_to=thread_id
        )
        db.session.add(tweet)
        db.session.commit()
        
        print(f"✅ Successfully posted tweet for token: {address}")
        return jsonify({
            'status': 'success',
            'message': f'Posted tweet for token {address}',
            'tweet': {
                'content': tweet_content,
                'response': tweet_response.data,
                'thread_id': thread_id,
                'generation': {
                    'messages': messages,
                    'model': "anthropic/claude-3-sonnet-20240229"
                },
                'db_record': tweet.to_dict()
            }
        })
        
    except Exception as e:
        print(f"❌ Error generating/posting tweet for token {address}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@jobs.route('/jobs/tweet/get/<tweet_id>', methods=['GET'])
@require_jobs_auth
def get_tweet(tweet_id):
    """
    Get a tweet by its ID using Twitter API
    """
    print(f"🔵 Getting tweet: {tweet_id}")
    try:
        # First check if we have this tweet in our database
        tweet = Tweet.query.filter_by(tweet_id=tweet_id).first()
        
        # Create Tweepy client using application credentials
        client = tweepy.Client(
            consumer_key=Config.TWITTER_API_KEY,
            consumer_secret=Config.TWITTER_API_SECRET
        )
        
        # Get tweet from Twitter API
        tweet_response = client.get_tweet(
            tweet_id,
            expansions=['author_id'],
            tweet_fields=['created_at', 'text', 'public_metrics']
        )
        
        if not tweet_response.data:
            print(f"❌ Tweet not found: {tweet_id}")
            return jsonify({
                'status': 'error',
                'message': f'Tweet {tweet_id} not found'
            }), 404

        response_data = {
            'status': 'success',
            'tweet': {
                'id': tweet_response.data.id,
                'text': tweet_response.data.text,
                'created_at': tweet_response.data.created_at,
                'metrics': tweet_response.data.public_metrics,
            }
        }

        # Add our database info if we have it
        if tweet:
            response_data['tweet']['generation'] = {
                'messages': tweet.messages,
                'model': tweet.model
            }
            response_data['tweet']['db_record'] = tweet.to_dict()

        print(f"✅ Successfully retrieved tweet: {tweet_id}")
        return jsonify(response_data)

    except Exception as e:
        print(f"❌ Error getting tweet {tweet_id}: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500