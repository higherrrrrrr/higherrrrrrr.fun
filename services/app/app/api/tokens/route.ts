import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse, handleApiError } from '@/lib/api-utils';
import { TokenListSchema } from '../../../lib/schemas';
import type { Token } from '@/lib/types';

const redis = await getRedisClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = (page - 1) * limit;

    const cacheKey = `tokens:${page}:${limit}`;
    let result = null;
    
    if (redis) {
      result = await redis.get(cacheKey);
      if (result) {
        return createApiResponse({ data: JSON.parse(result), status: 200 });
      }
    }

    const total = await prisma.token.count();

    if (total === 0) {
      return createApiResponse({ 
        data: { tokens: [], total: 0, page, limit, hasMore: false },
        status: 200 
      });
    }

    const tokens = await prisma.token.findMany({
      include: {
        marketData: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      },
      orderBy: {
        marketData: {
          _count: 'desc'
        }
      },
      take: limit,
      skip: offset
    });

    const formattedTokens = tokens.map(token => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      price: token.marketData[0]?.price || 0,
      priceChange24h: token.marketData[0]?.priceChange24h || 0,
      volume24h: token.marketData[0]?.volume24h || 0,
      marketCap: token.marketData[0]?.marketCap || 0,
      lastUpdated: token.marketData[0]?.updatedAt || new Date()
    }));

    result = { 
      tokens: formattedTokens, 
      total,
      page,
      limit,
      hasMore: offset + tokens.length < total
    };

    const validatedResult = TokenListSchema.parse(result);

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(validatedResult), { ex: 60 });
    }

    return createApiResponse({ data: validatedResult, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
} 