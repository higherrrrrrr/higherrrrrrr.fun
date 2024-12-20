import urllib.parse
import random
from flask import Blueprint, jsonify, current_app, request
from config import Config
from services.price_service import PriceService
from web3 import Web3
import json
from functools import lru_cache
import time
import requests
import traceback
from typing import List

trading = Blueprint('trading', __name__)

class DataCache:
    def __init__(self):
        self.data = None
        self.timestamp = 0

# Add latest tokens cache
latest_tokens_cache = DataCache()
LATEST_TOKENS_CACHE_DURATION = 5  # 5 seconds

# Add trading tokens cache
top_trading_cache = DataCache()
TOP_TRADING_CACHE_DURATION = 300  # 5 seconds

def filter_blacklisted_tokens(tokens: List[dict]) -> List[dict]:
    """Filter out any blacklisted tokens from the list"""
    blacklisted_addresses = set(addr.lower() for addr in Config.BLACKLISTED_TOKENS.split(',') if addr)
    return [
        token for token in tokens 
        if token['address'].lower() not in blacklisted_addresses
    ]

@trading.route('/tokens/latest', methods=['GET'])
def get_latest_token_deploys():
    try:
        print("\n=== Getting latest tokens from ponder ===")
        
        # Check cache first
        current_time = time.time()
        if latest_tokens_cache.data and current_time - latest_tokens_cache.timestamp < LATEST_TOKENS_CACHE_DURATION:
            print("✅ Returning cached latest tokens data")
            return jsonify(latest_tokens_cache.data)

        query_result = requests.get(f'{Config.PONDER_API_URL}/tokens/latest')

        query_result.raise_for_status()

        rows = query_result.json()

        if not rows:
            print("❌ No data from ponder query")
            return jsonify({'error': 'No data available'}), 404

        # Format the response
        tokens = [{
            'address': row['address'],
            'volume_24h': 0,  # New tokens won't have volume yet
            'trades_24h': 0,
            'name': row['name'],
            'symbol': row['symbol'],
            'protocol_version': row['protocolVersion'],
            'token_type': row['tokenType'],
            'market_type': row['marketType'],
            'pool_address': row['poolAddress'],
            'conviction_address': row['convictionAddress'],
            'creator_address': row['creatorAddress'],
            'creation_time': row['blockTimestamp'],
            'creation_tx': row['txHash']
        } for row in rows]

        # Add filtering before creating the response
        filtered_tokens = filter_blacklisted_tokens(tokens)

        response = {
            'tokens': filtered_tokens,
            'updated_at': int(current_time)
        }

        # Update cache
        latest_tokens_cache.data = response
        latest_tokens_cache.timestamp = current_time

        print(f"✅ Returning {len(filtered_tokens)} latest tokens")
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
def get_contract_address():
    return jsonify({
        'factory_address': Config.CONTRACT_ADDRESS
    })

@trading.route('/tokens/top-trading', methods=['GET'])
def get_top_trading_tokens():
    try:
        print("\n=== Getting top trading tokens from ponder ===")
        
        # Check cache first
        current_time = time.time()
        if top_trading_cache.data and current_time - top_trading_cache.timestamp < TOP_TRADING_CACHE_DURATION:
            print("✅ Returning cached top trading tokens data")
            return jsonify(top_trading_cache.data)

        
        query_result = requests.get(f'{Config.PONDER_API_URL}/tokens/top-trading')

        query_result.raise_for_status()

        rows = query_result.json()

        if not rows:
            print("❌ No data from ponder query")
            return jsonify({'error': 'No data available'}), 404

        # Format the response
        tokens = [{
            'address': row['address'],
            'volume_24h': row['transferCount'],
            'trades_24h': row['transferCount'],
            'creation_time': row['blockTimestamp'],
            'creation_tx': row['txHash']
        } for row in rows]

        # Add filtering before creating the response
        filtered_tokens = filter_blacklisted_tokens(tokens)

        response = {
            'tokens': filtered_tokens,
            'updated_at': int(current_time)
        }

        # Update cache
        top_trading_cache.data = response
        top_trading_cache.timestamp = current_time

        print(f"✅ Returning {len(filtered_tokens)} top trading tokens")
        return jsonify(response)

    except Exception as e:
        error_msg = f"Error fetching top trading tokens: {str(e)}"
        print(f"❌ {error_msg}")
        traceback.print_exc()
        
        # Return cached data if available
        if top_trading_cache.data:
            print("Returning cached data due to error")
            return jsonify(top_trading_cache.data)
            
        return jsonify({
            'error': error_msg,
            'details': traceback.format_exc()
        }), 500
