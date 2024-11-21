import urllib.parse
import random
from flask import Blueprint, jsonify, current_app, request
from .auth import require_auth
from config import Config

trading = Blueprint('trading', __name__)

def generate_ticker_data():
    return [random.randint(0, 100) for _ in range(24)]

def generate_random_eth_address():
    return "0x" + "".join(random.choices("0123456789abcdef", k=40))

def generate_random_token():
    address = generate_random_eth_address()
    
    return {
        "address": address,
        "symbol": "DEGEN",
        "name": "Degen Token",
        "description": "A token that is very degen",
        "image_url": f"https://picsum.photos/300/300?name={urllib.parse.quote(address)}",
        "price_levels": [
            {"name": "DEGEN", "greater_than": "0"},
            {"name": "DEGENK", "greater_than": "1000"},
            {"name": "DEGENKK", "greater_than": "2000"},
            {"name": "DEGENKKK", "greater_than": "3000"},
        ],
        "progress": random.randint(0, 100) / 100,
        "price": 0.0042,
        "volume_24h": 1234567.89,
        "market_cap": 9876543.21,
        "launch_date": "2024-03-19T00:00:00Z",
        "ticker_data": generate_ticker_data(),
    }

# Sample token data - you can move this to config or a separate data file
SAMPLE_TOKENS = [generate_random_token() for _ in range(50)]

@trading.route('/tokens/<token_address>', methods=['GET'])
@require_auth
def get_token(token_address):
    # Find token with matching address
    token = next((token for token in SAMPLE_TOKENS if token["address"].lower() == token_address.lower()), None)
    
    if not token:
        return jsonify({'error': 'Token not found'}), 404
        
    return jsonify(token)


@trading.route('/tokens', methods=['GET'])
@require_auth
def get_tokens():
    page = int(request.args.get('page', 1))
    limit = int(request.args.get('limit', 10))

    # Calculate start and end indices for pagination
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit

    # Get total count and paginated data
    total_tokens = len(SAMPLE_TOKENS)
    tokens_page = SAMPLE_TOKENS[start_idx:end_idx]

    return jsonify({
        'tokens': tokens_page,
        'pagination': {
            'current_page': page,
            'total_pages': (total_tokens + limit - 1) // limit,
            'total_items': total_tokens,
            'items_per_page': limit,
            'has_next': end_idx < total_tokens,
            'has_prev': page > 1
        }
    })

@trading.route('/price/<token_address>', methods=['GET'])
@require_auth
def get_price(token_address):
    # Placeholder for price fetching logic
    return jsonify({
        'token_address': token_address,
        'price': 0.0,  # Replace with actual price fetching
        'timestamp': '2024-03-19T00:00:00Z'
    })

@trading.route('/eth/price', methods=['GET'])
@require_auth
def get_eth_price():
    return jsonify({
        'symbol': 'ETH',
        'price_usd': 0.0,  # Replace with actual ETH price
        'timestamp': '2024-03-19T00:00:00Z'
    })

@trading.route('/candles/<token_address>', methods=['GET'])
@require_auth
def get_candles(token_address):
    # Placeholder for candle data
    sample_candle = {
        'timestamp': '2024-03-19T00:00:00Z',
        'open': 0.0,
        'high': 0.0,
        'low': 0.0,
        'close': 0.0,
        'volume': 0.0
    }

    return jsonify({
        'token_address': token_address,
        'interval': '1h',  # You might want to make this configurable
        'candles': [sample_candle] * 24  # Returns last 24 candles as placeholder
    })

@trading.route('/highlighted-tokens', methods=['GET'])
@require_auth
def get_highlighted_tokens():
    return jsonify({
        'tokens': Config.HIGHLIGHTED_TOKENS
    })

@trading.route('/contract-address', methods=['GET'])
@require_auth
def get_contract_address():
    return jsonify({
        'contract_address': Config.CONTRACT_ADDRESS
    })