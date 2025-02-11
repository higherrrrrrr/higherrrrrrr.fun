import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { priceService } from '@/lib/price-service';
import { createApiResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { SOL_MINT, SOL_DECIMALS, DEFAULT_DECIMALS, CACHE_KEYS, CACHE_TIMES, DATA_SOURCES, API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

const BalanceParamsSchema = z.object({
  address: z.string().min(1),
  wallet: z.string().min(1)
});

export async function GET(
  request: Request, 
  context: { params: { address: string; wallet: string } }
) {
  try {
    const params = BalanceParamsSchema.parse(context.params);
    const { address, wallet } = params;

    const cacheKey = CACHE_KEYS.BALANCE(address, wallet);
    let balanceData = null;
    
    if (redis) {
      balanceData = await redis.get(cacheKey);
      if (balanceData) {
        return createApiResponse({ 
          data: JSON.parse(balanceData), 
          status: HTTP_STATUS.OK 
        });
      }
    }

    const response = await fetch(API_ENDPOINTS.HELIUS_BALANCES(wallet));
    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.HELIUS_API_FAILED);
    }

    const data = await response.json();
    let tokenBalance = null;
    
    // Check if the requested token is SOL
    if (address === SOL_MINT && data.nativeBalance > 0) {
      const amount = data.nativeBalance / Math.pow(10, SOL_DECIMALS);
      const price = (await priceService.getTokenPrices([SOL_MINT])).get(SOL_MINT)?.price || 0;
      
      tokenBalance = {
        address: SOL_MINT,
        symbol: 'SOL',
        name: 'Solana',
        amount: amount.toString(),
        price: price.toString(),
        valueUsd: (amount * price).toString(),
        decimals: SOL_DECIMALS,
        dataSource: DATA_SOURCES.HELIUS,
        lastUpdated: new Date().toISOString()
      };
    } else {
      // Find the token in the list of token balances
      const token = data.tokens?.find((t: any) => t.mint === address);
      
      if (token) {
        const decimals = token.decimals || DEFAULT_DECIMALS;
        const amount = token.amount / Math.pow(10, decimals);
        const price = (await priceService.getTokenPrices([address])).get(address)?.price || 0;
        
        tokenBalance = {
          address: token.mint,
          symbol: token.symbol || 'Unknown',
          name: token.name || 'Unknown Token',
          amount: amount.toString(),
          price: price.toString(),
          valueUsd: (amount * price).toString(),
          decimals: decimals,
          dataSource: DATA_SOURCES.HELIUS,
          lastUpdated: new Date().toISOString()
        };
      }
    }

    if (!tokenBalance) {
      return createApiResponse({ 
        error: ERROR_MESSAGES.TOKEN_NOT_FOUND, 
        status: HTTP_STATUS.NOT_FOUND 
      });
    }

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(tokenBalance), { ex: CACHE_TIMES.WITH_PRICE });
    }

    return createApiResponse({ data: tokenBalance, status: HTTP_STATUS.OK });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse({
        error: ERROR_MESSAGES.INVALID_PARAMETERS,
        status: HTTP_STATUS.BAD_REQUEST,
        details: error.errors
      });
    }

    console.error('Failed to fetch token balance:', error);
    return createApiResponse({
      error: ERROR_MESSAGES.FETCH_BALANCE_FAILED,
      status: HTTP_STATUS.SERVER_ERROR
    });
  }
} 