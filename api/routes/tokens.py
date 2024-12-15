from flask import Blueprint, jsonify, request
from models.token import db, Token
from .auth import require_auth, require_token_creator, get_token_creator
from sqlalchemy import or_
from web3 import Web3
from config import Config
from eth_defi.uniswap_v3.price import estimate_buy_received_amount, estimate_sell_received_amount
from eth_defi.provider.multi_provider import create_multi_provider_web3
from eth_defi.uniswap_v3.deployment import fetch_deployment
from eth_abi import decode
from decimal import Decimal
import logging
import json
import os
from eth_defi.uniswap_v3.pool import fetch_pool_details
from clients.openrouter import get_openrouter_client

tokens = Blueprint('tokens', __name__)

# Constants - Base Mainnet addresses
WETH = "0x4200000000000000000000000000000000000006"  # WETH on Base
FEE_TIER = 500  # 0.05% fee tier
UNISWAP_V3_FACTORY = "0x33128a8fC17869897dcE68Ed026d694621f6FDfD"
POSITION_MANAGER = "0x03a520b32C04BF3bEEf7BEb72E919cf822Ed34f1"
QUOTER_V2 = "0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"
SWAP_ROUTER = "0x2626664c2603336E57B271c5C0b26F421741e481"  # SwapRouter02

# Initialize Web3
w3 = create_multi_provider_web3(Config.RPC_URL)

ABI_PATH = os.path.join(os.path.dirname(__file__), '../abi/UniswapV3Pool.json')

with open(ABI_PATH) as f:
    UNISWAP_V3_POOL_ABI = json.load(f)

def get_uniswap_deployment(token_address, pool_address):
    """Create Uniswap deployment for a specific token pair"""
    return fetch_deployment(
        web3=w3,
        factory_address=UNISWAP_V3_FACTORY,
        router_address=SWAP_ROUTER,
        position_manager_address=POSITION_MANAGER,
        quoter_address=QUOTER_V2,
        quoter_v2=True  # Since V1 is not deployed on Base
    )

def get_pool_price(pool_address):
    """Get the current price from a Uniswap V3 pool using eth_defi"""
    try:
        pool = fetch_pool_details(
            w3,
            Web3.to_checksum_address(pool_address)
        )
        return Decimal(str(pool.current_price))
    except Exception as e:
        logging.error(f"Failed to get pool price: {str(e)}")
        return None

@tokens.route('/token/<address>/creator', methods=['GET'])
def get_token_creator_endpoint(address):
    """Get the creator of a token"""
    token_address = address.lower()
    
    # Get from database
    creator = get_token_creator(token_address)
        
    return jsonify({
        'creator': creator,
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
            warpcast_app_key=data.get('warpcast_app_key'),
            ai_character=data.get('ai_character')
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
        if 'ai_character' in data:
            token.ai_character = data['ai_character']
    
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

@tokens.route('/token/<address>/quote/buy', methods=['GET'])
def get_buy_quote(address):
    try:
        amount = request.args.get('amount')
        pool_address = request.args.get('pool')
        
        if not amount:
            return jsonify({'error': 'Amount parameter is required'}), 400
        if not pool_address:
            return jsonify({'error': 'Pool address is required'}), 400
            
        # Validate addresses format
        if not Web3.is_address(address):
            return jsonify({'error': 'Invalid token address'}), 400
        if not Web3.is_address(pool_address):
            return jsonify({'error': 'Invalid pool address'}), 400

        # Convert amount to integer
        amount_wei = int(amount)

        try:
            # Try Uniswap quote first
            uniswap = get_uniswap_deployment(address, pool_address)
            amount_out = estimate_buy_received_amount(
                uniswap,
                address,
                WETH,
                amount_wei,
                FEE_TIER,
                slippage=50
            )
            
            quote_response = {
                'inputAmount': str(amount_wei),
                'outputAmount': str(amount_out),
                'priceImpact': "0.03",
                'fee': str(int(amount_wei * (FEE_TIER / 1000000))),
                'source': 'uniswap'
            }
        except Exception as e:
            logging.warning(f"Uniswap quote failed, falling back to pool price: {str(e)}")
            
            # Fallback to pool price calculation
            price = get_pool_price(pool_address)
            if price is None:
                return jsonify({'error': 'Failed to get price from pool'}), 400
                
            # Calculate simple price * quantity
            output_amount = int(Decimal(str(amount_wei)) / price)
            fee = int(amount_wei * (FEE_TIER / 1000000))
            
            quote_response = {
                'inputAmount': str(amount_wei),
                'outputAmount': str(output_amount),
                'priceImpact': "0.03",
                'fee': str(fee),
                'source': 'pool_price'
            }

        return jsonify(quote_response)

    except ValueError as e:
        return jsonify({'error': f'Invalid amount format: {str(e)}'}), 400
    except Exception as e:
        logging.error(f"Quote error: {str(e)}")
        return jsonify({'error': f'Failed to get buy quote: {str(e)}'}), 500

@tokens.route('/token/<address>/quote/sell', methods=['GET'])
def get_sell_quote(address):
    try:
        amount = request.args.get('amount')
        pool_address = request.args.get('pool')
        
        if not amount:
            return jsonify({'error': 'Amount parameter is required'}), 400
        if not pool_address:
            return jsonify({'error': 'Pool address is required'}), 400
            
        # Validate addresses format
        if not Web3.is_address(address):
            return jsonify({'error': 'Invalid token address'}), 400
        if not Web3.is_address(pool_address):
            return jsonify({'error': 'Invalid pool address'}), 400

        # Convert amount to integer
        amount_wei = int(amount)

        try:
            # Try Uniswap quote first
            uniswap = get_uniswap_deployment(address, pool_address)
            amount_out = estimate_sell_received_amount(
                uniswap,
                address,
                WETH,
                amount_wei,
                FEE_TIER,
                slippage=50
            )
            
            quote_response = {
                'inputAmount': str(amount_wei),
                'outputAmount': str(amount_out),
                'priceImpact': "0.03",
                'fee': str(int(amount_wei * (FEE_TIER / 1000000))),
                'source': 'uniswap'
            }
        except Exception as e:
            logging.warning(f"Uniswap quote failed, falling back to pool price: {str(e)}")
            
            # Fallback to pool price calculation
            price = get_pool_price(pool_address)
            if price is None:
                return jsonify({'error': 'Failed to get price from pool'}), 400
                
            # Calculate simple price * quantity
            output_amount = int(Decimal(str(amount_wei)) * price)
            fee = int(amount_wei * (FEE_TIER / 1000000))
            
            quote_response = {
                'inputAmount': str(amount_wei),
                'outputAmount': str(output_amount),
                'priceImpact': "0.03",
                'fee': str(fee),
                'source': 'pool_price'
            }

        return jsonify(quote_response)

    except ValueError as e:
        return jsonify({'error': f'Invalid amount format: {str(e)}'}), 400
    except Exception as e:
        logging.error(f"Quote error: {str(e)}")
        return jsonify({'error': f'Failed to get sell quote: {str(e)}'}), 500 

@tokens.route('/generate-example-tweet', methods=['POST'])
def generate_example_tweet():
    """
    Generate an example tweet based on provided character JSON
    
    Request body:
        ai_character (dict): Character configuration including name, bio, style, etc.
        
    Returns:
        JSON response containing the generated tweet
    """
    data = request.get_json()
    
    if not data or 'ai_character' not in data:
        return jsonify({
            'error': 'Request must include ai_character configuration'
        }), 400
        
    try:
        client = get_openrouter_client()
        example_tweet = client.generate_example_tweet(data['ai_character'])
        
        return jsonify({
            'tweet': example_tweet
        })
        
    except Exception as e:
        return jsonify({
            'error': f'Failed to generate tweet: {str(e)}'
        }), 500 