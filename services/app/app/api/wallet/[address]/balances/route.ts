import { NextResponse } from 'next/server';
import { getRedisClient } from '@/lib/redis';
import { priceService } from '@/lib/price-service';
import { createApiResponse } from '@/lib/api-utils';
import { z } from 'zod';
import { SOL_MINT, SOL_DECIMALS, DEFAULT_DECIMALS, CACHE_KEYS, CACHE_TIMES, DATA_SOURCES, API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';

const redis = await getRedisClient();

const WalletParamsSchema = z.object({
  address: z.string().min(1)
});

export async function GET(
  request: Request, 
  context: { params: { address: string } }
) {
  try {
    const params = WalletParamsSchema.parse(context.params);
    const { address } = params;

    const cacheKey = CACHE_KEYS.BALANCES(address);
    let balanceData = null;

    if (redis) {
      balanceData = await redis.get(cacheKey);
      if (balanceData) {
        const parsed = JSON.parse(balanceData);
        console.debug('Returning cached balances:', {
          total: parsed.tokens.length,
          withPrice: parsed.tokens.filter((t: any) => parseFloat(t.price) > 0).length,
          withoutPrice: parsed.tokens.filter((t: any) => parseFloat(t.price) === 0).length,
          totalValue: parsed.tokens.reduce((acc: number, t: any) => acc + parseFloat(t.valueUsd || '0'), 0)
        });
        return createApiResponse({ data: parsed, status: HTTP_STATUS.OK });
      }
    }

    const response = await fetch(API_ENDPOINTS.HELIUS_BALANCES(address));
    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.HELIUS_API_FAILED);
    }
    
    const data = await response.json();
    const tokenAddresses = [
      ...(data.nativeBalance > 0 ? [SOL_MINT] : []),
      ...(data.tokens?.map((t: any) => t.mint) || [])
    ];

    const prices = await priceService.getTokenPrices(tokenAddresses);
    const tokens: any[] = [];

    // Process SOL balance if present
    if (data.nativeBalance > 0) {
      const solBalance = data.nativeBalance / Math.pow(10, SOL_DECIMALS);
      const solPrice = prices.get(SOL_MINT)?.price || 0;
      
      tokens.push({
        address: SOL_MINT,
        symbol: 'SOL',
        name: 'Solana',
        amount: solBalance.toString(),
        price: solPrice.toString(),
        valueUsd: (solBalance * solPrice).toString(),
        decimals: SOL_DECIMALS,
        dataSource: DATA_SOURCES.HELIUS,
        lastUpdated: new Date().toISOString()
      });
    }

    // Process token balances
    if (data.tokens) {
      for (const token of data.tokens) {
        const decimals = token.decimals || DEFAULT_DECIMALS;
        const amount = token.amount / Math.pow(10, decimals);
        const price = prices.get(token.mint)?.price || 0;
        
        tokens.push({
          address: token.mint,
          symbol: token.symbol || 'Unknown',
          name: token.name || 'Unknown Token',
          amount: amount.toString(),
          price: price.toString(),
          valueUsd: (amount * price).toString(),
          decimals: decimals,
          dataSource: DATA_SOURCES.HELIUS,
          lastUpdated: new Date().toISOString()
        });
      }
    }

    const result = {
      tokens,
      stats: {
        total: tokens.length,
        withPrice: tokens.filter(t => parseFloat(t.price) > 0).length,
        withoutPrice: tokens.filter(t => parseFloat(t.price) === 0).length,
        totalValue: tokens.reduce((acc, t) => acc + parseFloat(t.valueUsd), 0)
      }
    };

    if (redis) {
      await redis.set(cacheKey, JSON.stringify(result), { ex: CACHE_TIMES.WITH_PRICE });
    }

    console.debug('Fetched new balances:', result.stats);
    return createApiResponse({ data: result, status: HTTP_STATUS.OK });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return createApiResponse({
        error: ERROR_MESSAGES.INVALID_PARAMETERS,
        status: HTTP_STATUS.BAD_REQUEST,
        details: error.errors
      });
    }

    console.error('Failed to fetch balances:', error);
    return createApiResponse({
      error: ERROR_MESSAGES.FETCH_BALANCES_FAILED,
      status: HTTP_STATUS.SERVER_ERROR
    });
  }
} 