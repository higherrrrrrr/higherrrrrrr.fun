from flask import Blueprint, jsonify, request
from models.token import db, Token
from .auth import require_auth, require_token_creator, get_token_creator
from sqlalchemy import or_

tokens = Blueprint('tokens', __name__)

@tokens.route('/token/<address>/creator', methods=['GET'])
def get_token_creator_endpoint(address):
    """Get the verified creator of a token"""
    token_address = address.lower()
    
    # Check cached creator first
    token = Token.query.filter_by(address=token_address).first()
    if token and token.verified_creator:
        return jsonify({
            'creator': token.verified_creator,
            'source': 'cache'
        })
    
    # Get from subgraph if not cached
    creator = get_token_creator(token_address)
    if not creator:
        return jsonify({'error': 'Could not verify token creator'}), 400
        
    # Cache the creator if we found it
    if token:
        token.verified_creator = creator
        try:
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            print(f"Error caching creator: {e}")
    
    return jsonify({
        'creator': creator,
        'source': 'subgraph'
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
    
    # Get verified creator from subgraph
    verified_creator = get_token_creator(token_address)
    
    if is_new:
        # Create new token
        token = Token(
            address=token_address,
            creator=creator_address,
            verified_creator=verified_creator,
            twitter_url=data.get('twitter_url'),
            telegram_url=data.get('telegram_url'),
            website=data.get('website')
        )
        db.session.add(token)
    else:
        # Update existing token if creator matches
        if token.creator.lower() != creator_address.lower():
            return jsonify({'error': 'Not authorized - must be token creator'}), 403
            
        # Update fields
        if verified_creator:
            token.verified_creator = verified_creator
        if 'twitter_url' in data:
            token.twitter_url = data['twitter_url']
        if 'telegram_url' in data:
            token.telegram_url = data['telegram_url']
        if 'website' in data:
            token.website = data['website']
    
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
        return jsonify({'error': 'Token not found'}), 404
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