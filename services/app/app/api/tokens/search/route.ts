import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse, handleApiError } from '@/lib/api-utils';
import { TokenSearchSchema } from '../../../../lib/schemas';
import type { Token } from '@/lib/types';

const redis = await getRedisClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    if (query.length < 2) {
      return createApiResponse({
        error: 'Search query must be at least 2 characters',
        status: 400
      });
    }

    const cacheKey = `search:${query}:${page}:${limit}`;
    let result = null;

    if (redis) {
      result = await redis.get(cacheKey);
      if (result) {
        return createApiResponse({ data: JSON.parse(result), status: 200 });
      }
    }

    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { symbol: { contains: query, mode: 'insensitive' } },
            { address: { equals: query } }
          ]
        },
        include: {
          marketData: {
            orderBy: { updatedAt: 'desc' },
            take: 1
          }
        },
        take: limit,
        skip: offset
      }),
      prisma.token.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { symbol: { contains: query, mode: 'insensitive' } },
            { address: { equals: query } }
          ]
        }
      })
    ]);

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
      hasMore: offset + tokens.length < total,
      query
    };

    const validatedResult = TokenSearchSchema.parse(result);

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(validatedResult), { ex: 60 });
    }

    return createApiResponse({ data: validatedResult, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

function filterTokens(tokens: any[], filter: string) {
  switch (filter) {
    case 'trending':
      return tokens
        .sort((a, b) => (b.marketData?.volume24h || 0) - (a.marketData?.volume24h || 0))
        .slice(0, 100);
    
    case 'new':
      const sevenDaysAgo = new Date(Date.now() - (7 * 24 * 60 * 60 * 1000));
      return tokens
        .filter(token => token.createdAt > sevenDaysAgo)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    case 'gainers':
      return tokens
        .sort((a, b) => (b.marketData?.priceChange24h || 0) - (a.marketData?.priceChange24h || 0))
        .slice(0, 100);
    
    default:
      return tokens;
  }
} 