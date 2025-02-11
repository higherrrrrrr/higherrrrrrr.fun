import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { CACHE_KEYS, CACHE_TIMES, DATA_SOURCES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

const SearchParamsSchema = z.object({
  query: z.string().min(1),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const params = SearchParamsSchema.parse({
      query: searchParams.get('query'),
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    });

    const cacheKey = CACHE_KEYS.SEARCH(params.query, params.page, params.limit);
    let result = null;

    if (redis) {
      result = await redis.get(cacheKey);
      if (result) {
        return createApiResponse({ data: JSON.parse(result), status: HTTP_STATUS.OK });
      }
    }

    const offset = (params.page - 1) * params.limit;

    // Search tokens in database
    const [tokens, total] = await Promise.all([
      prisma.token.findMany({
        where: {
          OR: [
            { symbol: { contains: params.query, mode: 'insensitive' } },
            { name: { contains: params.query, mode: 'insensitive' } },
            { address: params.query }
          ]
        },
        include: {
          marketData: {
            take: 1,
            orderBy: { timestamp: 'desc' }
          }
        },
        skip: offset,
        take: params.limit,
        orderBy: [
          { marketData: { _count: 'desc' } },
          { symbol: 'asc' }
        ]
      }),
      prisma.token.count({
        where: {
          OR: [
            { symbol: { contains: params.query, mode: 'insensitive' } },
            { name: { contains: params.query, mode: 'insensitive' } },
            { address: params.query }
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
      lastUpdated: token.marketData[0]?.updatedAt || new Date(),
      source: DATA_SOURCES.DATABASE
    }));

    result = {
      tokens: formattedTokens,
      total,
      page: params.page,
      limit: params.limit,
      hasMore: offset + tokens.length < total,
      query: params.query
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TIMES.DEFAULT });
    }

    return createApiResponse({ data: result, status: HTTP_STATUS.OK });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse({
        error: ERROR_MESSAGES.INVALID_PARAMETERS,
        status: HTTP_STATUS.BAD_REQUEST,
        details: error.errors
      });
    }

    console.error('Failed to search tokens:', error);
    return createApiResponse({
      error: ERROR_MESSAGES.SEARCH_FAILED,
      status: HTTP_STATUS.SERVER_ERROR
    });
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