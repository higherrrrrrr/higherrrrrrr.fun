from functools import wraps
from flask import request, jsonify
from eth_account.messages import encode_defunct
from eth_account import Account
from web3 import Web3
from config import Config
import requests

# Initialize Web3
w3 = Web3(Web3.HTTPProvider(Config.RPC_URL))

# Token creation bytecode signature
TOKEN_CREATION_SIGNATURE = "0x60806040"  # Standard ERC20 creation bytecode prefix

def recover_address(message, signature):
    """Verify that the signature was signed by the address"""
    try:
        # Recover the message hash that was signed
        message_hash = encode_defunct(text=message)
        # Recover the address that signed the message
        recovered_address = Account.recover_message(message_hash, signature=signature)

        return str(recovered_address).lower()
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
            recovered = recover_address(message, signature)
            
            if not recovered:
                return jsonify({'error': 'Invalid signature'}), 401

            # Add the verified address to the request context
            request.eth_address = recovered

            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': 'Invalid authorization format'}), 401
            
    return decorated

def get_token_creation_tx(token_address: str) -> str:
    """Get the creation transaction hash from the subgraph"""
    query = """
    query GetTokenCreation($token: String!) {
        newTokenEvents(where: {token: $token}, first: 1) {
            transactionHash
        }
    }
    """
    
    try:
        response = requests.post(
            Config.TOKENS_SUBGRAPH_URL,
            json={
                'query': query,
                'variables': {
                    'token': token_address.lower()
                }
            }
        )
        
        data = response.json()
        events = data.get('data', {}).get('newTokenEvents', [])
        
        if events:
            return events[0]['transactionHash']
        return None
        
    except Exception as e:
        print(f"Subgraph query error: {e}")
        return None

def get_and_set_token_creator(token_address: str) -> str:
    """
    Get the creator address from database or fetch and save it if not found
    Returns lowercase creator address or None if not found
    """
    try:
        from models.token import Token, db
        
        # Get token from database
        token = Token.query.filter_by(address=token_address.lower()).first()

        if not token:
            token = Token.create_if_not_exists(token_address)
            db.session.commit()
            
        # Return cached creator if exists and isn't same as token address
        if token.creator and token.creator.lower() != token.address.lower():
            return token.creator.lower()
            
        # Fetch creator from chain
        tx_hash = get_token_creation_tx(token_address)
        if not tx_hash:
            return None
            
        # Get transaction details from RPC
        tx = w3.eth.get_transaction(tx_hash)
        creator = tx['from'].lower()
        
        # Save creator to database
        token.creator = creator
        db.session.commit()
        
        return creator
        
    except Exception as e:
        print(f"Error getting/setting token creator: {e}")
        return None

def require_token_creator(f):
    """
    Decorator that requires the authenticated wallet to be the token creator
    Must be used after @require_auth
    Checks for token address in path parameters first, then request body
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            # First check path parameters
            token_address = kwargs.get('address')
            
            # If not in path, check request body
            if not token_address:
                data = request.get_json()
                if not data or 'address' not in data:
                    return jsonify({'error': 'Token address required'}), 400
                token_address = data['address']
                
            token_address = token_address.lower()
                
            # Get authenticated wallet
            auth_wallet = request.eth_address.lower()
            
            # Get and set token creator
            creator = get_and_set_token_creator(token_address)
                
            # Verify authenticated wallet is creator
            if auth_wallet != creator:
                return jsonify({'error': 'Not authorized - must be token creator'}), 403
                
            return f(*args, **kwargs)
            
        except Exception as e:
            print(f"Error checking token creator authorization: {e}")
            return jsonify({'error': 'Error checking token creator authorization'}), 500
            
    return decorated