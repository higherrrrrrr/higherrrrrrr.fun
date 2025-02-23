import { NextResponse } from 'next/server';
import { withRetry } from '../../../../lib/retry';
import { logger } from '../../../../lib/logger';
import { withApiHandler } from '../../../../lib/apiHandler';

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

let priceCache = {
  price: null,
  timestamp: 0
};

async function getEthPriceFromSource() {
  return withRetry(async () => {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum.usd;
  });
}

export const GET = withApiHandler(async () => {
  const currentTime = Date.now() / 1000; // Convert to seconds
  
  // Return cached price if it's still valid
  if (priceCache.price && currentTime - priceCache.timestamp < CACHE_DURATION) {
    logger.debug('Returning cached ETH price');
    return NextResponse.json({
      symbol: 'ETH',
      price_usd: priceCache.price,
      timestamp: priceCache.timestamp
    });
  }
  
  try {
    // Fetch new price if cache is invalid
    const price = await getEthPriceFromSource();
    
    // Update cache
    priceCache = {
      price,
      timestamp: currentTime
    };
    
    logger.info('Updated ETH price cache:', { price });
    return NextResponse.json({
      symbol: 'ETH',
      price_usd: price,
      timestamp: currentTime
    });
  } catch (error) {
    logger.error('Failed to fetch ETH price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ETH price' },
      { status: 500 }
    );
  }
}); 