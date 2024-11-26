import { getApiUrl } from './getApiUrl';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
let ethPriceCache = {
  price: null,
  timestamp: 0
};

export async function getTokenPrice(address) {
  const response = await fetch(
    `${getApiUrl()}/price/${address}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
}

export async function getEthPrice() {
  // Return cached price if it's still valid
  if (ethPriceCache.price && Date.now() - ethPriceCache.timestamp < CACHE_DURATION) {
    return ethPriceCache.price;
  }

  const response = await fetch(
    `${getApiUrl()}/eth/price`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  const data = await response.json();
  
  // Update cache
  ethPriceCache = {
    price: data,
    timestamp: Date.now()
  };
  
  return data;
} 