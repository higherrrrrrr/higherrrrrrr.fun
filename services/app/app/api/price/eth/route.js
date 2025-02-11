import { NextResponse } from 'next/server';

// Cache duration in seconds (5 minutes)
const CACHE_DURATION = 300;

let priceCache = {
  price: null,
  timestamp: 0
};

async function getEthPriceFromSource() {
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    const data = await response.json();
    return data.ethereum.usd;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    throw new Error('Failed to fetch ETH price');
  }
}

export async function GET() {
  const currentTime = Date.now() / 1000; // Convert to seconds
  
  // Return cached price if it's still valid
  if (priceCache.price && currentTime - priceCache.timestamp < CACHE_DURATION) {
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
    
    return NextResponse.json({
      symbol: 'ETH',
      price_usd: price,
      timestamp: currentTime
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch ETH price' },
      { status: 500 }
    );
  }
} 