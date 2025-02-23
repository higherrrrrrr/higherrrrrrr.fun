import { NextResponse } from 'next/server';
import { withApiHandler } from '../../../../lib/apiHandler';
import { logger } from '../../../../lib/logger';
import { TokensService } from '../../../../services/tokens';
import { cache } from '../../../../lib/cache';

export const GET = withApiHandler(async (request) => {
  try {
    const cacheKey = 'solana_price';
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const solanaToken = await TokensService.getToken('SOL');
    if (!solanaToken) {
      return NextResponse.json(
        { error: 'Failed to fetch Solana price' },
        { status: 500 }
      );
    }

    const response = {
      price: solanaToken.price,
      change_24h: solanaToken.price_change_24h,
      updated_at: new Date().toISOString()
    };

    await cache.set(cacheKey, response, 60); // Cache for 1 minute
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to fetch Solana price:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Solana price' },
      { status: 500 }
    );
  }
});