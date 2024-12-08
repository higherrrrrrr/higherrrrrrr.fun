from flask import Blueprint, jsonify, request
from models.token import db, Token
from .auth import require_auth, require_token_creator, get_token_creator
from sqlalchemy import or_

tokens = Blueprint('tokens', __name__)

@tokens.route('/token/<address>/creator', methods=['GET'])
def get_token_creator_endpoint(address):
    """Get the creator of a token"""
    token_address = address.lower()
    
    # Get from database
    token = Token.query.filter_by(address=token_address).first()
    if not token:
        return jsonify({'error': 'Token not found'}), 404
        
    return jsonify({
        'creator': token.creator,
        'source': 'database'
    })

@tokens.route('/token', methods=['POST'])
@require_auth
@require_token_creator
def upsert_token():
    data = request.get_json()
    
    if not data or 'address' not in data:
        return jsonify({'error': 'Address is required'}), 400
        
    token_address = data['address'].lower()
    creator_address = request.eth_address
    
    # Try to find existing token
    token = Token.query.filter_by(address=token_address).first()
    is_new = token is None
    
    if is_new:
        # Create new token
        token = Token(
            address=token_address,
            creator=creator_address,
            twitter=data.get('twitter'),
            telegram=data.get('telegram'),
            website=data.get('website'),
            description=data.get('description'),
            warpcast_url=data.get('warpcast_url'),
            character_prompt=data.get('character_prompt'),
            warpcast_app_key=data.get('warpcast_app_key')
        )
        db.session.add(token)
    else:
        # Update existing token if creator matches
        if token.creator.lower() != creator_address.lower():
            return jsonify({'error': 'Not authorized - must be token creator'}), 403
            
        # Update fields
        if 'twitter' in data:
            token.twitter = data['twitter']
        if 'telegram' in data:
            token.telegram = data['telegram']
        if 'website' in data:
            token.website = data['website']
        if 'description' in data:
            token.description = data['description']
        if 'warpcast_url' in data:
            token.warpcast_url = data['warpcast_url']
        if 'character_prompt' in data:
            token.character_prompt = data['character_prompt']
        if 'warpcast_app_key' in data:
            token.warpcast_app_key = data['warpcast_app_key']
    
    try:
        db.session.commit()
        return jsonify(token.to_dict()), 201 if is_new else 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tokens.route('/token/<address>', methods=['GET'])
def get_token(address):
    token = Token.query.filter_by(address=address.lower()).first()
    if not token:
        return jsonify({})
    return jsonify(token.to_dict())

@tokens.route('/tokens', methods=['GET'])
def list_tokens():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    tokens = Token.query.paginate(page=page, per_page=per_page)
    
    return jsonify({
        'tokens': [token.to_dict() for token in tokens.items],
        'total': tokens.total,
        'pages': tokens.pages,
        'current_page': tokens.page
    }) 