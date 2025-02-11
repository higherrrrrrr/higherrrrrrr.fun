import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse } from '@/lib/api-utils';
import { priceService } from '@/lib/price-service';
import { CACHE_KEYS, CACHE_TIMES, DATA_SOURCES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    const cacheKey = CACHE_KEYS.TOKENS_PAGE(page, limit);
    let result = null;
    
    if (redis) {
      result = await redis.get(cacheKey);
      if (result) {
        return createApiResponse({ 
          data: JSON.parse(result), 
          status: HTTP_STATUS.OK 
        });
      }
    }

    // Get all tokens from GeckoTerminal
    const allTokens = await priceService.getAllTokens();
    const total = allTokens.length;

    if (total === 0) {
      return createApiResponse({ 
        data: { tokens: [], total: 0, page, limit, hasMore: false },
        status: HTTP_STATUS.OK 
      });
    }

    // Paginate tokens
    const tokens = allTokens.slice(offset, offset + limit);

    const formattedTokens = tokens.map(token => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      price: token.price,
      priceChange24h: token.price_change_24h,
      volume24h: token.volume_24h,
      marketCap: token.market_cap,
      lastUpdated: token.last_updated,
      source: DATA_SOURCES.GECKOTERMINAL
    }));

    result = { 
      tokens: formattedTokens, 
      total,
      page,
      limit,
      hasMore: offset + tokens.length < total
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TIMES.WITH_PRICE });
    }

    return createApiResponse({ data: result, status: HTTP_STATUS.OK });
  } catch (error) {
    console.error(ERROR_MESSAGES.FETCH_TOKEN_FAILED, error);
    return createApiResponse({ 
      error: ERROR_MESSAGES.FETCH_TOKEN_FAILED,
      status: HTTP_STATUS.SERVER_ERROR 
    });
  }
} 