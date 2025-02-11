import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse } from '@/lib/api-utils';
import { DEFAULT_DECIMALS, CACHE_KEYS, CACHE_TIMES, API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';
import { env } from '@/lib/env.mjs';

const redis = await getRedisClient();

export async function GET(
  request: Request, 
  { params }: { params: { address: string } }
) {
  const { address } = params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const before = searchParams.get('before');
  
  if (!address) {
    return createApiResponse({
      error: ERROR_MESSAGES.MISSING_PARAMETERS,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }

  try {
    const cacheKey = CACHE_KEYS.TRANSACTIONS(address, limit, before);
    let transactions = null;
    
    if (redis) {
      transactions = await redis.get(cacheKey);
      if (transactions) {
        return createApiResponse({ 
          data: JSON.parse(transactions), 
          status: HTTP_STATUS.OK 
        });
      }
    }

    const token = await prisma.token.findUnique({
      where: { address },
      select: { decimals: true }
    });

    const response = await fetch(
      API_ENDPOINTS.HELIUS_TRANSACTIONS(address),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: {
            accounts: [address],
            startSlot: before ? parseInt(before) : undefined,
            limit,
            type: 'TOKEN_TRANSFER',
          },
          options: {
            encoding: 'jsonParsed',
            maxSupportedTransactionVersion: 0,
            withTokenBalances: true,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.HELIUS_API_FAILED);
    }

    const data = await response.json();
    const decimals = token?.decimals ?? DEFAULT_DECIMALS;

    const result = {
      transactions: data,
      decimals,
      next: data.length === limit ? data[data.length - 1]?.slot : null
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TIMES.DEFAULT });
    }

    return createApiResponse({ data: result, status: HTTP_STATUS.OK });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return createApiResponse({
      error: ERROR_MESSAGES.FETCH_TRANSACTIONS_FAILED,
      status: HTTP_STATUS.SERVER_ERROR
    });
  }
} 