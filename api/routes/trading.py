import urllib.parse
import random
from flask import Blueprint, jsonify, current_app, request
from .auth import require_auth
from config import Config
from services.price_service import PriceService
from web3 import Web3
import json
from functools import lru_cache
import time
import requests

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

# Cache for latest tokens
class TokenCache:
    def __init__(self):
        self.tokens = []
        self.timestamp = 0

token_cache = TokenCache()
CACHE_DURATION = 60  # 1 minute in seconds

def get_latest_tokens(limit=10):
    global token_cache
    current_time = time.time()
    
    # Return cached tokens if they're still valid
    if token_cache.tokens and current_time - token_cache.timestamp < CACHE_DURATION:
        print("Returning cached tokens")
        return token_cache.tokens[:limit]
    
    try:
        print(f"Using RPC URL: {Config.RPC_URL}")
        print(f"Using Contract Address: {Config.CONTRACT_ADDRESS}")
        
        w3 = Web3(Web3.HTTPProvider(Config.RPC_URL))
        
        if not w3.is_connected():
            print("Failed to connect to RPC endpoint")
            return []
            
        contract_address = Web3.to_checksum_address(Config.CONTRACT_ADDRESS)
        factory_contract = w3.eth.contract(
            address=contract_address, 
            abi=FACTORY_ABI
        )
        
        latest_block = w3.eth.block_number
        print(f"Latest block: {latest_block}")
        
        # Look back further - 10000 blocks instead of 1000
        from_block = max(0, latest_block - 10000)
        
        # Get all NewToken events
        try:
            # First try with create_filter
            event_filter = factory_contract.events.NewToken.create_filter(
                fromBlock=from_block
            )
            events = event_filter.get_all_entries()
        except Exception as e:
            print(f"Filter method failed, trying get_logs: {str(e)}")
            # Fallback to get_logs if create_filter fails
            events = w3.eth.get_logs({
                'address': contract_address,
                'fromBlock': from_block,
                'toBlock': 'latest',
                'topics': [
                    Web3.keccak(text='NewToken(address,address)').hex()
                ]
            })
        
        # Sort by block number descending
        sorted_events = sorted(
            events, 
            key=lambda x: x['blockNumber'], 
            reverse=True
        )
        
        tokens = []
        for event in sorted_events:
            try:
                # Handle both direct event logs and filtered events
                if hasattr(event, 'args'):
                    token_address = event.args.token
                else:
                    # Decode the event data manually
                    token_address = '0x' + event['topics'][1][-40:]
                
                block = w3.eth.get_block(event['blockNumber'])
                
                tokens.append({
                    'address': token_address,
                    'conviction': event.args.conviction if hasattr(event, 'args') else None,
                    'timestamp': block['timestamp'],
                    'block_number': event['blockNumber'],
                    'transaction_hash': event['transactionHash'].hex()
                })
                
            except Exception as e:
                print(f"Error processing event: {str(e)}")
                continue
        
        print(f"Found {len(tokens)} tokens")
        
        # Update cache
        token_cache.tokens = tokens
        token_cache.timestamp = current_time
        
        return tokens[:limit]
        
    except Exception as e:
        print(f"Error in get_latest_tokens: {str(e)}")
        import traceback
        traceback.print_exc()
        if token_cache.tokens:
            print("Returning expired cached tokens due to error")
            return token_cache.tokens[:limit]
        return []

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
            'error': 'Failed to fetch latest tokens',
            'details': str(e)
        }), 500

# Cache duration in seconds (5 minutes)
CACHE_DURATION = 300

class PriceCache:
    def __init__(self):
        self.price = None
        self.timestamp = 0

eth_price_cache = PriceCache()

def get_eth_price_from_source():
    # Replace with your actual ETH price source
    response = requests.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
    return response.json()['ethereum']['usd']

@lru_cache(maxsize=1)
def get_cached_timestamp():
    return time.time()

def get_eth_price():
    global eth_price_cache
    current_time = time.time()
    
    # Return cached price if it's still valid
    if eth_price_cache.price and current_time - eth_price_cache.timestamp < CACHE_DURATION:
        return jsonify({'price': eth_price_cache.price})
    
    # Fetch new price if cache is invalid
    try:
        price = get_eth_price_from_source()
        eth_price_cache.price = price
        eth_price_cache.timestamp = current_time
        return jsonify({'price': price})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@trading.route('/eth/price', methods=['GET'])
@require_auth
def get_eth_price():
    price_data = PriceService.get_eth_price()
    return jsonify({
        'symbol': 'ETH',
        'price_usd': price_data['price_usd'],
        'timestamp': price_data['timestamp']
    })

@trading.route('/highlighted-token', methods=['GET'])
@require_auth
def get_highlighted_token():
    highlighted_address = Config.HIGHLIGHTED_TOKEN
    print("Config values:", {
        "HIGHLIGHTED_TOKEN": Config.HIGHLIGHTED_TOKEN,
        "CONTRACT_ADDRESS": Config.CONTRACT_ADDRESS,
        "RPC_URL": Config.RPC_URL
    })
    
    if not highlighted_address:
        print("No highlighted token found in config")
        return jsonify({'error': 'No highlighted token configured'}), 404
        
    try:
        print(f"Returning highlighted token with address: {highlighted_address}")
        # Create a token object with the address
        token = {
            'address': highlighted_address.strip(),  # Clean any whitespace
        }
        
        print(f"Returning highlighted token: {token}")
        return jsonify(token)  # Make sure we're returning valid JSON
        
    except Exception as e:
        print(f"Error getting highlighted token: {str(e)}")
        import traceback
        traceback.print_exc()  # Print full stack trace
        return jsonify({
            'error': 'Failed to get highlighted token',
            'details': str(e)
        }), 500

@trading.route('/contract-address', methods=['GET'])
@require_auth
def get_contract_address():
    return jsonify({
        'factory_address': Config.CONTRACT_ADDRESS
    })
