import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

interface PricePoint {
  timestamp: number;
  price: number;
  volume: number;
}

const redis = await getRedisClient();

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const { searchParams } = new URL(request.url);
  const interval = searchParams.get('interval') || '1d';
  const limit = parseInt(searchParams.get('limit') || '100');
  
  try {
    // Try Redis cache first
    const cacheKey = `token:${address}:price-history:${interval}:${limit}`;
    let priceHistory: PricePoint[] | null = null;
    
    if (redis) {
      priceHistory = await redis.get(cacheKey);
    }

    if (!priceHistory) {
      // Get price history from database
      const history = await prisma.priceHistory.findMany({
        where: {
          token: { address },
          interval
        },
        orderBy: { timestamp: 'desc' },
        take: limit
      });

      priceHistory = history.map(point => ({
        timestamp: point.timestamp.getTime(),
        price: point.price,
        volume: point.volume
      }));

      // Cache results
      if (redis) {
        await redis.set(cacheKey, priceHistory, { ex: 300 }); // 5 minute cache
      }
    }

    return NextResponse.json(priceHistory);
  } catch (error) {
    console.error('Failed to fetch price history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history' },
      { status: 500 }
    );
  }
} 