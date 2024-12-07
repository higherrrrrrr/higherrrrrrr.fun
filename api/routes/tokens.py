from flask import Blueprint, jsonify, request
from models.token import db, Token
from .auth import require_auth

tokens = Blueprint('tokens', __name__)

@tokens.route('/token/<address>', methods=['GET'])
def get_token(address):
    token = Token.query.filter_by(address=address.lower()).first()
    if not token:
        return jsonify({'error': 'Token not found'}), 404
    return jsonify(token.to_dict())

@tokens.route('/token', methods=['POST'])
@require_auth
def create_token():
    data = request.get_json()
    
    if not data or 'address' not in data:
        return jsonify({'error': 'Address is required'}), 400
        
    # Check if token already exists
    existing_token = Token.query.filter_by(address=data['address'].lower()).first()
    if existing_token:
        return jsonify({'error': 'Token already exists'}), 409
        
    token = Token(
        address=data['address'],
        twitter_url=data.get('twitter_url'),
        telegram_url=data.get('telegram_url'),
        website=data.get('website')
    )
    
    try:
        db.session.add(token)
        db.session.commit()
        return jsonify(token.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tokens.route('/token/<address>', methods=['PUT'])
@require_auth
def update_token(address):
    token = Token.query.filter_by(address=address.lower()).first()
    if not token:
        return jsonify({'error': 'Token not found'}), 404
        
    data = request.get_json()
    
    if 'twitter_url' in data:
        token.twitter_url = data['twitter_url']
    if 'telegram_url' in data:
        token.telegram_url = data['telegram_url']
    if 'website' in data:
        token.website = data['website']
        
    try:
        db.session.commit()
        return jsonify(token.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@tokens.route('/token/<address>', methods=['DELETE'])
@require_auth
def delete_token(address):
    token = Token.query.filter_by(address=address.lower()).first()
    if not token:
        return jsonify({'error': 'Token not found'}), 404
        
    try:
        db.session.delete(token)
        db.session.commit()
        return jsonify({'message': 'Token deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

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