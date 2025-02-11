import { NextResponse } from 'next/server';
import { priceService } from '@/lib/price-service';
import { createApiResponse } from '@/lib/api-utils';
import { getRedisClient } from '@/lib/redis';
import { CACHE_KEYS, CACHE_TIMES, DATA_SOURCES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';
import type { TokenPrice } from '@/lib/types';

const redis = await getRedisClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokens = searchParams.get('tokens');

  if (!tokens) {
    return createApiResponse({ 
      error: ERROR_MESSAGES.NO_TOKENS_PROVIDED,
      status: HTTP_STATUS.BAD_REQUEST 
    });
  }

  try {
    const uniqueTokens = [...new Set(tokens.split(','))].filter(Boolean);
    const cacheKey = CACHE_KEYS.PRICES(uniqueTokens);
    let priceData = null;

    if (redis) {
      priceData = await redis.get(cacheKey);
      if (priceData) {
        const parsed = JSON.parse(priceData);
        console.debug('Returning cached prices:', {
          total: uniqueTokens.length,
          withPrice: Object.keys(parsed.data).length,
          withoutPrice: uniqueTokens.length - Object.keys(parsed.data).length
        });
        return createApiResponse({ data: parsed, status: HTTP_STATUS.OK });
      }
    }

    const prices = await priceService.getTokenPrices(uniqueTokens);
    const tokenPrices: Record<string, TokenPrice & { source: string; quality: number }> = {};

    for (const [address, tokenInfo] of prices.entries()) {
      tokenPrices[address] = {
        ...tokenInfo,
        source: DATA_SOURCES.GECKOTERMINAL,
        quality: 1,
        confidence: 1
      };
    }

    const stats = {
      total: uniqueTokens.length,
      withPrice: Object.keys(tokenPrices).length,
      withoutPrice: uniqueTokens.length - Object.keys(tokenPrices).length
    };

    const result = { data: tokenPrices, stats };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TIMES.WITH_PRICE });
    }

    console.debug('Fetched new prices:', stats);
    return createApiResponse({ data: result, status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    return createApiResponse({
      error: ERROR_MESSAGES.FETCH_PRICES_FAILED,
      status: HTTP_STATUS.SERVER_ERROR
    });
  }
} 