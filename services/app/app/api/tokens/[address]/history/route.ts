import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { z } from 'zod';
import { createApiResponse, handleApiError } from '@/lib/api-utils';

const redis = await getRedisClient();

const PriceHistorySchema = z.object({
  timestamps: z.array(z.number()),
  prices: z.array(z.number()),
  volumes: z.array(z.number())
});

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');
  
  try {
    const cacheKey = `token:${address}:history:${days}`;
    let historyData = null;
    
    if (redis) {
      historyData = await redis.get(cacheKey);
      if (historyData) return NextResponse.json(JSON.parse(historyData));
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const priceHistory = await prisma.priceHistoryPoint.findMany({
      where: {
        tokenAddress: address,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    const formattedHistory = {
      timestamps: priceHistory.map(p => p.timestamp.getTime()),
      prices: priceHistory.map(p => p.price),
      volumes: priceHistory.map(p => p.volume || 0)
    };

    const validatedHistory = PriceHistorySchema.parse(formattedHistory);

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(validatedHistory), { ex: 300 });
    }

    return createApiResponse({
      data: validatedHistory,
      status: 200
    });
  } catch (error) {
    return handleApiError(error);
  }
} 