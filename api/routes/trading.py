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
import traceback

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

class TokenCache:
    def __init__(self):
        self.tokens = []
        self.timestamp = 0

token_cache = TokenCache()
CACHE_DURATION = 60  # 1 minute in seconds

def get_latest_tokens(limit=10):
    global token_cache
    current_time = time.time()
    
    try:
        # Debug connection info
        print("\n=== Starting get_latest_tokens ===")
        print(f"RPC URL: {Config.RPC_URL}")
        print(f"Factory Address: {Config.CONTRACT_ADDRESS}")
        
        # Check cache
        if token_cache.tokens and current_time - token_cache.timestamp < CACHE_DURATION:
            print("Returning cached tokens")
            return token_cache.tokens[:limit]
        
        # Initialize Web3
        w3 = Web3(Web3.HTTPProvider(Config.RPC_URL))
        
        if not w3.is_connected():
            print("❌ Failed to connect to RPC endpoint")
            return []
        
        print("✅ Connected to RPC endpoint")
            
        # Setup contract
        try:
            contract_address = Web3.to_checksum_address(Config.CONTRACT_ADDRESS)
            factory_contract = w3.eth.contract(
                address=contract_address, 
                abi=FACTORY_ABI
            )
            print("✅ Contract initialized")
        except Exception as e:
            print("❌ Failed to initialize contract:", str(e))
            traceback.print_exc()
            return []
        
        # Get latest block
        latest_block = w3.eth.block_number
        from_block = max(0, latest_block - 10000)
        print(f"Scanning blocks {from_block} to {latest_block}")
        
        # Get events
        try:
            print("Attempting to get events using create_filter...")
            event_filter = factory_contract.events.NewToken.create_filter(
                fromBlock=from_block
            )
            events = event_filter.get_all_entries()
            print(f"✅ Found {len(events)} events using create_filter")
        except Exception as filter_error:
            print(f"❌ Filter method failed: {str(filter_error)}")
            print("Falling back to get_logs...")
            
            try:
                event_signature_hash = Web3.keccak(text='NewToken(address,address)').hex()
                events = w3.eth.get_logs({
                    'address': contract_address,
                    'fromBlock': from_block,
                    'toBlock': 'latest',
                    'topics': [event_signature_hash]
                })
                print(f"✅ Found {len(events)} events using get_logs")
            except Exception as logs_error:
                print(f"❌ get_logs failed: {str(logs_error)}")
                traceback.print_exc()
                return []
        
        # Process events
        tokens = []
        for event in sorted(events, key=lambda x: x['blockNumber'], reverse=True):
            try:
                print(f"\nProcessing event from block {event['blockNumber']}")
                
                if hasattr(event, 'args'):
                    print("Event has args - using direct access")
                    token_address = event.args.token
                    conviction_address = event.args.conviction
                else:
                    print("Event is raw log - decoding manually")
                    topics = event['topics']
                    token_address = Web3.to_checksum_address('0x' + topics[1].hex()[-40:])
                    conviction_address = Web3.to_checksum_address('0x' + topics[2].hex()[-40:])
                
                print(f"Token Address: {token_address}")
                print(f"Conviction Address: {conviction_address}")
                
                block = w3.eth.get_block(event['blockNumber'])
                
                token_data = {
                    'address': token_address,
                    'conviction': conviction_address,
                    'timestamp': block['timestamp'],
                    'block_number': event['blockNumber'],
                    'transaction_hash': event['transactionHash'].hex()
                }
                print(f"✅ Successfully processed token: {token_data}")
                tokens.append(token_data)
                
            except Exception as e:
                print(f"❌ Error processing event: {str(e)}")
                traceback.print_exc()
                continue
        
        print(f"\n=== Found {len(tokens)} total tokens ===")
        
        # Update cache
        token_cache.tokens = tokens
        token_cache.timestamp = current_time
        
        return tokens[:limit]
        
    except Exception as e:
        print(f"❌ Fatal error in get_latest_tokens: {str(e)}")
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
        print(f"\n=== GET /tokens/latest with limit={limit} ===")
        
        tokens = get_latest_tokens(limit)
        print(f"Returning {len(tokens)} tokens")
        
        return jsonify({
            'tokens': tokens
        })
    except Exception as e:
        error_msg = f"Error getting latest tokens: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        return jsonify({
            'error': error_msg,
            'details': traceback.format_exc()
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
def get_eth_price():
    price_data = PriceService.get_eth_price()
    return jsonify({
        'symbol': 'ETH',
        'price_usd': price_data['price_usd'],
        'timestamp': price_data['timestamp']
    })

@trading.route('/highlighted-token', methods=['GET'])
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
