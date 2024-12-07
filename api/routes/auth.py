from functools import wraps
from flask import request, jsonify
from eth_account.messages import encode_defunct
from eth_account import Account

def verify_ethereum_signature(message, signature, address):
    """Verify that the signature was signed by the address"""
    try:
        # Recover the message hash that was signed
        message_hash = encode_defunct(text=message)
        # Recover the address that signed the message
        recovered_address = Account.recover_message(message_hash, signature=signature)
        # Compare recovered address with claimed address (case-insensitive)
        return recovered_address.lower() == address.lower()
    except Exception as e:
        print(f"Signature verification error: {e}")
        return False

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid authorization header'}), 401
        
        try:
            # Extract the components from the authorization header
            # Format: Bearer <address>:<signature>
            _, auth_data = auth_header.split(' ', 1)
            address, signature = auth_data.split(':')
            
            # Fixed message to sign
            message = "we're going higherrrrrrr"
            
            # Verify the signature
            if not verify_ethereum_signature(message, signature, address):
                return jsonify({'error': 'Invalid signature'}), 401
            
            # Add the verified address to the request context
            request.eth_address = address.lower()
            
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Authentication error: {e}")
            return jsonify({'error': 'Invalid authorization format'}), 401
            
    return decorated