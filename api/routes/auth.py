from functools import wraps
from flask import request, jsonify
from config import Config

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        # Debug logging
        print("Received auth header:", auth_header)
        print("Config AUTH_TOKEN:", Config.AUTH_TOKEN)
        
        # Always expect "Bearer token" format
        if not auth_header.lower().startswith('bearer '):
            print("Auth failed - missing Bearer prefix")
            return jsonify({'error': 'Unauthorized'}), 401
            
        token = auth_header.split(' ')[1].strip()
            
        # Compare the actual token value
        if not token or token != Config.AUTH_TOKEN:
            print(f"Auth failed - token mismatch. Got '{token}', expected '{Config.AUTH_TOKEN}'")
            return jsonify({'error': 'Unauthorized'}), 401
            
        return f(*args, **kwargs)
    return decorated