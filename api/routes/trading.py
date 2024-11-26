import urllib.parse
import random
from flask import Blueprint, jsonify, current_app, request
from .auth import require_auth
from config import Config
from services.price_service import PriceService
from web3 import Web3
import json

trading = Blueprint('trading', __name__)

# Add ABI for NewToken event
FACTORY_ABI = [
    {
        "anonymous": False,
        "inputs": [
            {
                "indexed": True,
                "name": "token",
                "type": "address"
            },
            {
                "indexed": True,
                "name": "conviction",
                "type": "address"
            }
        ],
        "name": "NewToken",
        "type": "event"
    }
]

def get_latest_tokens(limit=10):
    w3 = Web3(Web3.HTTPProvider(Config.RPC_URL))
    factory_contract = w3.eth.contract(
        address=Config.CONTRACT_ADDRESS, 
        abi=FACTORY_ABI
    )
    
    # Get latest block
    latest_block = w3.eth.block_number
    
    # Look back 1000 blocks or to genesis
    from_block = max(0, latest_block - 1000)
    
    # Get NewToken events
    events = factory_contract.events.NewToken.get_logs(
        fromBlock=from_block,
        toBlock='latest'
    )
    
    # Sort by block number descending and take latest n
    sorted_events = sorted(
        events, 
        key=lambda x: x['blockNumber'], 
        reverse=True
    )[:limit]
    
    tokens = []
    for event in sorted_events:
        token_address = event['args']['token']
        block = w3.eth.get_block(event['blockNumber'])
        
        tokens.append({
            'address': token_address,
            'conviction': event['args']['conviction'],
            'timestamp': block['timestamp'],
            'block_number': event['blockNumber'],
            'transaction_hash': event['transactionHash'].hex()
        })
    
    return tokens

@trading.route('/tokens/latest', methods=['GET'])
@require_auth
def get_latest_token_deploys():
    try:
        limit = int(request.args.get('limit', 10))
        tokens = get_latest_tokens(limit)
        return jsonify({
            'tokens': tokens
        })
    except Exception as e:
        current_app.logger.error(f"Error getting latest tokens: {str(e)}")
        return jsonify({
            'error': 'Failed to fetch latest tokens'
        }), 500

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

def generate_random_nft():
    address = generate_random_eth_address()
    return {
        "address": address,
        "name": "Random NFT",
        "minted_at": "2024-03-19T00:00:00Z",
        "image_url": f"https://picsum.photos/800/800?name={urllib.parse.quote(address)}",
        "url": "https://opensea.io/assets/matic/0x251be3a17af4892035c37ebf5890f4a4d889dcad/78760900044811865368794127132449502176772068012355272429732834490166931582278",
    }

@trading.route('/nfts/<address>', methods=['GET'])
@require_auth
def get_nfts_for_address(address):
    nfts = [generate_random_nft() for _ in range(50)]
       
    return jsonify(nfts)


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
    price_data = PriceService.get_eth_price()
    return jsonify({
        'symbol': 'ETH',
        'price_usd': price_data['price_usd'],
        'timestamp': price_data['timestamp']
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

@trading.route('/highlighted-token', methods=['GET'])
@require_auth
def get_highlighted_token():
    return SAMPLE_TOKENS[0]


@trading.route('/contract-address', methods=['GET'])
@require_auth
def get_contract_address():
    return jsonify({
        'factory_address': Config.CONTRACT_ADDRESS
    })
