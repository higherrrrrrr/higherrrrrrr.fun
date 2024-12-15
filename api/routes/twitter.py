from flask import Blueprint, jsonify, request, session, url_for, render_template
from models.token import Token, db
from config import Config
import tweepy
from .auth import require_token_creator, require_auth

twitter = Blueprint('twitter', __name__)

def get_twitter_oauth():
    return tweepy.OAuth1UserHandler(
        Config.TWITTER_API_KEY,
        Config.TWITTER_API_SECRET,
        callback=Config.TWITTER_CALLBACK_URL
    )

@twitter.route('/twitter/connect/<token_address>', methods=['POST'])
def twitter_connect(token_address):
    """Start Twitter OAuth flow for a token"""
    try:
        oauth = get_twitter_oauth()
        auth_url = oauth.get_authorization_url()
        
        # Get or create token record
        token = Token.create_if_not_exists(token_address)
        token.temp_request_token = oauth.request_token
        print(token.temp_request_token)
        db.session.commit()
        
        return jsonify({
            'auth_url': auth_url
        }), 200
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to start Twitter authorization: {str(e)}'
        }), 500

@twitter.route('/twitter/callback', methods=['GET'])
def twitter_callback():
    """Handle Twitter OAuth callback"""
    try:
        verifier = request.args.get('oauth_verifier')
        oauth_token = request.args.get('oauth_token')  # Twitter returns this
        state = request.args.get('state')  # Our token_address
        
        if not all([verifier, oauth_token, state]):
            return jsonify({
                'error': 'Invalid OAuth callback parameters'
            }), 400
            
        # Get request token from session and verify it matches
        request_token = session.get('request_token')
        if not request_token or request_token['oauth_token'] != oauth_token:
            return jsonify({
                'error': 'Invalid OAuth token'
            }), 400
            
        token_address = state
        
        # Render the page that will complete the connection with signature
        return render_template('twitter_callback.html', 
                            token_address=token_address,
                            verifier=verifier)
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to complete Twitter authorization: {str(e)}'
        }), 500

@twitter.route('/twitter/complete', methods=['POST'])
@require_auth
@require_token_creator
def twitter_complete():
    """Complete Twitter connection with signature"""
    try:
        data = request.get_json()
        verifier = data.get('verifier')
        token_address = data.get('token_address')
        
        # Get token and its stored request token
        token = Token.query.filter_by(address=token_address.lower()).first()
        if not token or not token.temp_request_token:
            return jsonify({
                'error': 'Invalid token or missing request token'
            }), 400
        
        oauth = get_twitter_oauth()
        oauth.request_token = token.temp_request_token
        
        access_token, access_token_secret = oauth.get_access_token(verifier)
        
        # Initialize API client
        client = tweepy.Client(
            consumer_key=Config.TWITTER_API_KEY,
            consumer_secret=Config.TWITTER_API_SECRET,
            access_token=access_token,
            access_token_secret=access_token_secret
        )
        
        # Get user info
        user = client.get_me()
        
        # Update token with Twitter credentials and clear temp token
        token.twitter_oauth_token = access_token
        token.twitter_oauth_secret = access_token_secret
        token.twitter_user_id = user.data.id
        token.twitter_username = user.data.username
        token.temp_request_token = None  # Clear the temporary token
        db.session.commit()
        
        return jsonify({
            'success': True,
            'username': user.data.username
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to complete Twitter authorization: {str(e)}'
        }), 500

@twitter.route('/twitter/disconnect/<token_address>', methods=['POST'])
@require_token_creator
def twitter_disconnect(token_address):
    """Remove Twitter connection from a token"""
    try:
        token = Token.query.filter_by(address=token_address.lower()).first()
        if token:
            token.twitter_oauth_token = None
            token.twitter_oauth_secret = None
            token.twitter_user_id = None
            token.twitter_username = None
            db.session.commit()
            
            return jsonify({
                'success': True
            })
            
        return jsonify({
            'error': 'Token not found'
        }), 404
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to disconnect Twitter: {str(e)}'
        }), 500 