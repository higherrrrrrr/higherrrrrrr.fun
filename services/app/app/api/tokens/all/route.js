import { NextResponse } from 'next/server';
import { withApiHandler } from '../../../../lib/apiHandler';
import { logger } from '../../../../lib/logger';
import { TokensService } from '../../../../services/tokens';
import { cache } from '../../../../lib/cache';

export const GET = withApiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type')?.toLowerCase() || 'all';

  try {
    const cacheKey = `tokens_${type}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    let tokens;
    switch (type) {
      case 'major':
        tokens = await TokensService.getMajorTokens();
        break;
      case 'meme':
        tokens = await TokensService.getMemeTokens();
        break;
      case 'vc':
        tokens = await TokensService.getVCBackedTokens();
        break;
      default:
        tokens = await TokensService.getAllTokens();
    }

    const response = {
      tokens,
      updated_at: new Date().toISOString()
    };

    await cache.set(cacheKey, response, 300); // Cache for 5 minutes
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to fetch tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}); 