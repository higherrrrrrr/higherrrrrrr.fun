from functools import wraps
from flask import request, jsonify
from config import Config
from datetime import datetime
import pytz

def is_past_unlock_time():
    # Target time: November 26th, 2024 at 11:59:59 PM EST
    est = pytz.timezone('America/New_York')
    unlock_time = datetime(2024, 11, 26, 23, 59, 59, tzinfo=est)
    now = datetime.now(est)
    return now >= unlock_time

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # First check if we're past the unlock time
        if is_past_unlock_time():
            return f(*args, **kwargs)
            
        # If not past unlock time, check bearer token
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({
                'message': 'Unauthorized'
            }), 401

        try:
            # Simple bearer token check
            token_type, token = auth_header.split()
            if token_type.lower() != 'bearer' or token != Config.AUTH_TOKEN:
                raise ValueError('Invalid token')

            return f(*args, **kwargs)
        except Exception as e:
            return jsonify({
                'message': 'Unauthorized'
            }), 401

    return decorated