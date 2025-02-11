import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { priceService } from '@/lib/price-service';
import { createApiResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { DEFAULT_DECIMALS, CACHE_KEYS, CACHE_TIMES, API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

const HoldersParamsSchema = z.object({
  address: z.string().min(1)
});

export async function GET(
  request: Request, 
  { params }: { params: { address: string } }
) {
  try {
    const validatedParams = HoldersParamsSchema.parse(params);
    const { address } = validatedParams;
    
    const cacheKey = CACHE_KEYS.HOLDERS(address);
    let holders = null;
    
    if (redis) {
      holders = await redis.get(cacheKey);
      if (holders) {
        const parsed = JSON.parse(holders);
        console.debug('Returning cached holders:', {
          total: parsed.total,
          price: parsed.price,
          totalSupply: parsed.totalSupply
        });
        return createApiResponse({ data: parsed, status: HTTP_STATUS.OK });
      }
    }

    // Get token data and price info in parallel
    const [token, prices] = await Promise.all([
      prisma.token.findUnique({
        where: { address },
        select: { decimals: true, totalSupply: true }
      }),
      priceService.getTokenPrices([address])
    ]);

    if (!token) {
      return createApiResponse({
        error: ERROR_MESSAGES.TOKEN_NOT_FOUND,
        status: HTTP_STATUS.NOT_FOUND
      });
    }

    const price = prices.get(address)?.price || 0;
    const decimals = token.decimals ?? DEFAULT_DECIMALS;

    // Fetch holders from Helius
    const response = await fetch(
      API_ENDPOINTS.HELIUS_TOKEN_ACCOUNTS,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint: address })
      }
    );

    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.HELIUS_API_FAILED);
    }

    const data = await response.json();

    const holderData = {
      total: data.length,
      price,
      totalSupply: token.totalSupply || '0',
      decimals,
      stats: {
        uniqueHolders: data.length,
        averageBalance: data.length > 0 
          ? data.reduce((acc: number, h: any) => acc + (h.amount / Math.pow(10, decimals)), 0) / data.length 
          : 0,
        totalValue: price * (parseInt(token.totalSupply || '0') / Math.pow(10, decimals))
      },
      holders: data.map((h: any) => {
        const amount = h.amount / Math.pow(10, decimals);
        return {
          address: h.owner,
          amount: amount.toString(),
          valueUsd: (amount * price).toString(),
          percentage: token.totalSupply 
            ? ((h.amount / parseInt(token.totalSupply)) * 100).toString()
            : '0'
        };
      }),
      lastUpdated: new Date().toISOString()
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(holderData), { ex: CACHE_TIMES.DEFAULT });
    }

    console.debug('Fetched new holders:', {
      total: holderData.total,
      price: holderData.price,
      totalSupply: holderData.totalSupply
    });

    return createApiResponse({ data: holderData, status: HTTP_STATUS.OK });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse({
        error: ERROR_MESSAGES.INVALID_PARAMETERS,
        status: HTTP_STATUS.BAD_REQUEST,
        details: error.errors
      });
    }

    console.error('Failed to fetch holders:', error);
    return createApiResponse({
      error: ERROR_MESSAGES.FETCH_HOLDERS_FAILED,
      status: HTTP_STATUS.SERVER_ERROR
    });
  }
} 