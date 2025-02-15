import { NextResponse } from 'next/server';
import tokenCache from '../../../../services/tokens';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Missing token address' },
        { status: 400 }
      );
    }

    // Get cached token instance
    const token = await tokenCache.getCachedToken(address);
    
    // Make sure price is up to date
    if (token.isStale()) {
      await token.update();
    }

    const price = token.getSpotPrice();
    
    if (price === null) {
      return NextResponse.json(
        { error: 'Price not available' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      address,
      price,
      metadata: token.getMetadata(),
      timestamp: token.lastUpdate
    });

  } catch (error) {
    console.error('Error fetching token price:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
}