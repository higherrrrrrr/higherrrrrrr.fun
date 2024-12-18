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