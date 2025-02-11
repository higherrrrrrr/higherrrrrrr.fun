import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse } from '@/lib/api-utils';
import type { MarketData } from '@/lib/types';
import { priceService } from '@/lib/price-service';
import { CACHE_KEYS, CACHE_TIMES, DATA_SOURCES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  
  if (!address) {
    return createApiResponse({
      error: ERROR_MESSAGES.MISSING_PARAMETERS,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }

  try {
    const cacheKey = CACHE_KEYS.MARKET(address);
    let marketData: MarketData | null = null;
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return createApiResponse({ data: JSON.parse(cached), status: HTTP_STATUS.OK });
      }
    }

    const prices = await priceService.getTokenPrices([address]);
    const tokenInfo = prices.get(address);
    
    marketData = {
      price: tokenInfo?.price || 0,
      confidence: tokenInfo ? 1 : 0,
      marketCap: tokenInfo?.market_cap || 0,
      volume24h: tokenInfo?.volume_24h || 0,
      volumeChange24h: 0,
      priceChange24h: tokenInfo?.price_change_24h || 0,
      priceChange7d: 0,
      priceChange30d: 0,
      volume7d: 0,
      volume30d: 0,
      totalLiquidity: 0,
      holders: 0,
      supply: {
        total: '0',
        circulating: '0'
      },
      lastUpdated: tokenInfo?.last_updated || new Date().toISOString(),
      source: tokenInfo ? DATA_SOURCES.GECKOTERMINAL : DATA_SOURCES.NONE,
      quality: tokenInfo ? 1 : 0
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(marketData), { ex: CACHE_TIMES.WITH_PRICE });
    }

    return createApiResponse({ data: marketData, status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return createApiResponse({ 
      error: ERROR_MESSAGES.FETCH_MARKET_FAILED,
      status: HTTP_STATUS.SERVER_ERROR 
    });
  }
} 