from flask import Blueprint, jsonify, request, session, url_for, render_template
from models.token import Token, db
from config import Config
import tweepy
from .auth import require_token_creator

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
        
        # Store request token in session
        session['request_token'] = oauth.request_token
        session['token_address'] = token_address.lower()
        
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
        token_address = session.get('token_address')
        request_token = session.get('request_token')
        
        if not all([verifier, token_address, request_token]):
            return jsonify({
                'error': 'Invalid OAuth callback'
            }), 400
            
        # Get access token
        oauth = get_twitter_oauth()
        oauth.request_token = request_token
        
        # Here we'll show a page that requests signature before completing connection
        return render_template('twitter_callback.html', 
                            token_address=token_address,
                            verifier=verifier)
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to complete Twitter authorization: {str(e)}'
        }), 500

@twitter.route('/twitter/complete', methods=['POST'])
@require_token_creator
def twitter_complete():
    """Complete Twitter connection with signature"""
    try:
        data = request.get_json()
        verifier = data.get('verifier')
        token_address = data.get('token_address')
        
        oauth = get_twitter_oauth()
        oauth.request_token = session.get('request_token')
        
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
        
        # Update token with Twitter credentials
        token = Token.query.filter_by(address=token_address).first()
        if token:
            token.twitter_oauth_token = access_token
            token.twitter_oauth_secret = access_token_secret
            token.twitter_user_id = user.data.id
            token.twitter_username = user.data.username
            db.session.commit()
            
            return jsonify({
                'success': True,
                'username': user.data.username
            })
            
        return jsonify({
            'error': 'Token not found'
        }), 404
        
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