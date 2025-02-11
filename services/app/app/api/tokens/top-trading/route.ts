import { NextResponse } from 'next/server';
import { priceService } from '@/lib/price-service';
import { createApiResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    const allTokens = await priceService.getAllTokens();
    const topTokens = allTokens
      .sort((a, b) => b.volume_24h - a.volume_24h)
      .slice(0, 100);
      
    return createApiResponse({ 
      data: topTokens,
      status: 200 
    });
  } catch (error) {
    console.error('Failed to fetch token data:', error);
    return createApiResponse({ 
      error: 'Failed to fetch token data',
      status: 500 
    });
  }
} 