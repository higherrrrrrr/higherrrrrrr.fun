import { NextResponse } from 'next/server';
import tokenCache from '../../../../services/tokens';

export async function GET(request, { params }) {
  try {
    const address = await params.address;

    console.log(address);

    if (!address) {
      return NextResponse.json(
        { error: 'Missing token address' },
        { status: 400 }
      );
    }

    // Get cached token data directly from the cache
    const tokenData = await tokenCache.getToken(address);
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Token not found' },
        { status: 404 }
      );
    }

    // Return just the metadata fields
    return NextResponse.json({
      address,
      metadata: {
        name: tokenData.name,
        symbol: tokenData.symbol,
        volume_24h: tokenData.volume_24h,
        trades_24h: tokenData.trades_24h,
        total_accounts: tokenData.total_accounts,
        created_at: tokenData.created_at,
        decimals: tokenData.decimals
      },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Error fetching token metadata:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: error.message?.includes('not found') ? 404 : 500 }
    );
  }
} 