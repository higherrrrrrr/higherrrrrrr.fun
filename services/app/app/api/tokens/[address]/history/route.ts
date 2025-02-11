import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { CACHE_KEYS, CACHE_TIMES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

const HistoryParamsSchema = z.object({
  address: z.string().min(1),
  days: z.number().int().min(1).max(365).default(30)
});

const PriceHistorySchema = z.object({
  timestamps: z.array(z.number()),
  prices: z.array(z.number()),
  volumes: z.array(z.number()),
  marketCaps: z.array(z.number().nullable()),
  stats: z.object({
    minPrice: z.number(),
    maxPrice: z.number(),
    avgPrice: z.number(),
    totalVolume: z.number(),
    priceChange: z.number(),
    priceChangePercent: z.number()
  })
});

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const validatedParams = HistoryParamsSchema.parse({
      address: params.address,
      days: parseInt(searchParams.get('days') || '30')
    });
    
    const cacheKey = CACHE_KEYS.TOKEN_HISTORY(validatedParams.address, validatedParams.days);
    let historyData = null;
    
    if (redis) {
      historyData = await redis.get(cacheKey);
      if (historyData) {
        return createApiResponse({ 
          data: JSON.parse(historyData), 
          status: HTTP_STATUS.OK 
        });
      }
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - validatedParams.days);

    const priceHistory = await prisma.priceHistoryPoint.findMany({
      where: {
        tokenAddress: validatedParams.address,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (priceHistory.length === 0) {
      return createApiResponse({
        error: ERROR_MESSAGES.NO_HISTORY_DATA,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const prices = priceHistory.map(p => p.price);
    const formattedHistory = {
      timestamps: priceHistory.map(p => p.timestamp.getTime()),
      prices,
      volumes: priceHistory.map(p => p.volume || 0),
      marketCaps: priceHistory.map(p => p.marketCap),
      stats: {
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices),
        avgPrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        totalVolume: priceHistory.reduce((acc, p) => acc + (p.volume || 0), 0),
        priceChange: prices[prices.length - 1] - prices[0],
        priceChangePercent: ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100
      }
    };

    const validatedHistory = PriceHistorySchema.parse(formattedHistory);

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(validatedHistory), { ex: CACHE_TIMES.PRICE_HISTORY });
    }

    return createApiResponse({
      data: validatedHistory,
      status: HTTP_STATUS.OK
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse({
        error: ERROR_MESSAGES.INVALID_PARAMETERS,
        status: HTTP_STATUS.BAD_REQUEST,
        details: error.errors
      });
    }

    console.error('Failed to fetch token history:', error);
    return createApiResponse({ 
      error: ERROR_MESSAGES.FETCH_HISTORY_FAILED,
      status: HTTP_STATUS.SERVER_ERROR 
    });
  }
} 