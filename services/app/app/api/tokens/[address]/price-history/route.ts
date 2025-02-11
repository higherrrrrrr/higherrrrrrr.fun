import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { CACHE_KEYS, CACHE_TIMES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

const PriceHistoryParamsSchema = z.object({
  address: z.string().min(1),
  interval: z.enum(['1h', '1d', '7d', '30d']).default('1d'),
  limit: z.number().int().positive().max(1000).default(100)
});

const PricePointSchema = z.object({
  timestamp: z.number(),
  price: z.number(),
  volume: z.number().nullable(),
  marketCap: z.number().nullable()
});

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = PriceHistoryParamsSchema.parse({
      address: params.address,
      interval: searchParams.get('interval') || '1d',
      limit: parseInt(searchParams.get('limit') || '100')
    });
    
    const cacheKey = CACHE_KEYS.PRICE_HISTORY(validatedParams.address, validatedParams.interval, validatedParams.limit);
    let priceHistory = null;
    
    if (redis) {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return createApiResponse({ data: JSON.parse(cached), status: HTTP_STATUS.OK });
      }
    }

    const history = await prisma.priceHistoryPoint.findMany({
      where: {
        tokenAddress: validatedParams.address
      },
      orderBy: { timestamp: 'desc' },
      take: validatedParams.limit
    });

    priceHistory = history.map(point => ({
      timestamp: point.timestamp.getTime(),
      price: point.price,
      volume: null,
      marketCap: null
    }));

    const validatedHistory = z.array(PricePointSchema).parse(priceHistory);

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(validatedHistory), { ex: CACHE_TIMES.PRICE_HISTORY });
    }

    return createApiResponse({ data: validatedHistory, status: HTTP_STATUS.OK });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse({
        error: ERROR_MESSAGES.INVALID_PARAMETERS,
        status: HTTP_STATUS.BAD_REQUEST,
        details: error.errors
      });
    }

    console.error('Failed to fetch price history:', error);
    return createApiResponse({
      error: ERROR_MESSAGES.FETCH_HISTORY_FAILED,
      status: HTTP_STATUS.SERVER_ERROR
    });
  }
} 