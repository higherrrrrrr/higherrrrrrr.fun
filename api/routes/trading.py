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
from dune_client.client import DuneClient

trading = Blueprint('trading', __name__)

# Add Dune cache
class DuneCache:
    def __init__(self):
        self.data = None
        self.timestamp = 0

# Add latest tokens cache
latest_tokens_cache = DuneCache()
LATEST_TOKENS_CACHE_DURATION = 300  # 5 minutes

# Add trading tokens cache
dune_cache = DuneCache()
DUNE_CACHE_DURATION = 300  # 5 minutes

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
CACHE_DURATION = 3600  # 1 minute in seconds

@trading.route('/tokens/latest', methods=['GET'])
def get_latest_token_deploys():
    try:
        print("\n=== Getting latest tokens from Dune ===")
        
        # Check cache first
        current_time = time.time()
        if latest_tokens_cache.data and current_time - latest_tokens_cache.timestamp < LATEST_TOKENS_CACHE_DURATION:
            print("✅ Returning cached latest tokens data")
            return jsonify(latest_tokens_cache.data)

        # Initialize Dune client
        dune = DuneClient(Config.DUNE_API_KEY)
        
        # Fetch latest result for the deploys query
        print("Fetching from Dune query 4360134...")
        query_result = dune.get_latest_result(4360134)
        
        # Poll until query is complete
        max_attempts = 10
        attempt = 0
        while query_result.state == 'QUERY_STATE_EXECUTING' and attempt < max_attempts:
            print(f"Query executing, attempt {attempt + 1}/{max_attempts}...")
            time.sleep(3)  # Wait 3 seconds between checks
            query_result = dune.get_latest_result(4360134)
            attempt += 1
            
        print("Final Dune response:", query_result)
        
        if not query_result or not query_result.result or not query_result.result.rows:
            print("❌ No data from Dune query")
            return jsonify({'error': 'No data available'}), 404

        # Format the response
        tokens = [{
            'address': row['token_address'],
            'volume_24h': 0,  # New tokens won't have volume yet
            'trades_24h': 0,
            'creation_time': row['creation_time'],
            'creation_tx': row['creation_tx']
        } for row in query_result.result.rows]

        response = {
            'tokens': tokens,
            'updated_at': int(current_time)
        }

        # Update cache
        latest_tokens_cache.data = response
        latest_tokens_cache.timestamp = current_time

        print(f"✅ Returning {len(tokens)} latest tokens")
        return jsonify(response)

    except Exception as e:
        error_msg = f"Error fetching latest tokens: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        
        # Return cached data if available
        if latest_tokens_cache.data:
            print("Returning cached data due to error")
            return jsonify(latest_tokens_cache.data)
            
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
    highlighted_addresses = Config.HIGHLIGHTED_TOKENS.split(',') if Config.HIGHLIGHTED_TOKENS else []
    print("Config values:", {
        "HIGHLIGHTED_TOKENS": highlighted_addresses,
        "CONTRACT_ADDRESS": Config.CONTRACT_ADDRESS,
        "RPC_URL": Config.RPC_URL
    })
    
    if not highlighted_addresses:
        print("No highlighted tokens found in config")
        return jsonify({'tokens': []})
        
    try:
        print(f"Returning highlighted tokens: {highlighted_addresses}")
        # Create token objects for each address
        tokens = [
            {'address': address.strip()}  # Clean any whitespace
            for address in highlighted_addresses
        ]
        
        return jsonify({'tokens': tokens})
        
    except Exception as e:
        print(f"Error getting highlighted tokens: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to get highlighted tokens',
            'details': str(e)
        }), 500

@trading.route('/contract-address', methods=['GET'])
@require_auth
def get_contract_address():
    return jsonify({
        'factory_address': Config.CONTRACT_ADDRESS
    })

@trading.route('/tokens/top-trading', methods=['GET'])
def get_top_trading_tokens():
    try:
        print("\n=== Getting top trading tokens from Dune ===")
        
        # Check cache first
        current_time = time.time()
        if dune_cache.data and current_time - dune_cache.timestamp < DUNE_CACHE_DURATION:
            print("✅ Returning cached Dune data")
            return jsonify(dune_cache.data)

        # Initialize Dune client
        dune = DuneClient(Config.DUNE_API_KEY)
        
        # Fetch latest result for the volume query
        print("Fetching from Dune query 4342388...")
        query_result = dune.get_latest_result(4342388)
        
        # Poll until query is complete
        max_attempts = 10
        attempt = 0
        while query_result.state == 'QUERY_STATE_EXECUTING' and attempt < max_attempts:
            print(f"Query executing, attempt {attempt + 1}/{max_attempts}...")
            time.sleep(3)  # Wait 3 seconds between checks
            query_result = dune.get_latest_result(4342388)
            attempt += 1
            
        print("Final Dune response:", query_result)
        
        if not query_result or not query_result.result or not query_result.result.rows:
            print("❌ No data from Dune query")
            return jsonify({'error': 'No data available'}), 404

        # Format the response
        tokens = [{
            'address': row['token_address'],
            'volume_24h': row['transfer_count'],  # Using transfer count as volume for now
            'trades_24h': row['transfer_count'],
            'creation_time': row['creation_time'],
            'creation_tx': row['creation_tx']
        } for row in query_result.result.rows]

        response = {
            'tokens': tokens,
            'updated_at': int(current_time)
        }

        # Update cache
        dune_cache.data = response
        dune_cache.timestamp = current_time

        print(f"✅ Returning {len(tokens)} top trading tokens")
        return jsonify(response)

    except Exception as e:
        error_msg = f"Error fetching top trading tokens: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        
        # Return cached data if available
        if dune_cache.data:
            print("Returning cached data due to error")
            return jsonify(dune_cache.data)
            
        return jsonify({
            'error': error_msg,
            'details': traceback.format_exc()
        }), 500
