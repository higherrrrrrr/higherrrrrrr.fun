import requests
from datetime import datetime, timedelta
from cachetools import TTLCache
import logging

# Cache ETH price for 1 minute
eth_price_cache = TTLCache(maxsize=1, ttl=60)

class PriceService:
    COINGECKO_API = "https://api.coingecko.com/api/v3"
    
    @staticmethod
    def get_eth_price():
        try:
            # Check cache first
            cached_price = eth_price_cache.get('eth_usd')
            if cached_price:
                return cached_price
            
            # Fetch new price if not cached
            response = requests.get(
                f"{PriceService.COINGECKO_API}/simple/price",
                params={
                    "ids": "ethereum",
                    "vs_currencies": "usd"
                }
            )
            response.raise_for_status()
            
            price_data = response.json()
            current_price = price_data['ethereum']['usd']
            
            # Cache the new price
            eth_price_cache['eth_usd'] = {
                'price_usd': current_price,
                'timestamp': datetime.utcnow().isoformat() + 'Z'
            }
            
            return eth_price_cache['eth_usd']
            
        except Exception as e:
            logging.error(f"Failed to fetch ETH price: {str(e)}")
            # Return last cached price if available, otherwise return error data
            return eth_price_cache.get('eth_usd', {
                'price_usd': 0.0,
                'timestamp': datetime.utcnow().isoformat() + 'Z',
                'error': 'Failed to fetch price'
            }) 