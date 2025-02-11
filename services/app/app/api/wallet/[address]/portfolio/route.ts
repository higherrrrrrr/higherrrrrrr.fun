import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse } from '@/lib/api-utils';
import { priceService } from '@/lib/price-service';
import { SOL_MINT, SOL_DECIMALS, DEFAULT_DECIMALS, API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants';
import type { Portfolio, TokenBalance } from '@/lib/types';
import { env } from '@/lib/env.mjs';

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  
  if (!address) {
    return createApiResponse({
      error: ERROR_MESSAGES.NO_WALLET_ADDRESS,
      status: HTTP_STATUS.BAD_REQUEST
    });
  }

  try {
    const response = await fetch(API_ENDPOINTS.HELIUS_BALANCES(address));
    
    if (!response.ok) {
      throw new Error(ERROR_MESSAGES.HELIUS_API_FAILED);
    }

    const data = await response.json();

    // Get all token addresses including SOL
    const tokenAddresses = [
      ...(data.nativeBalance > 0 ? [SOL_MINT] : []),
      ...(data.tokens?.map((t: any) => t.mint) || [])
    ];

    // Get prices for all tokens in one batch
    const prices = await priceService.getTokenPrices(tokenAddresses);

    const tokens: TokenBalance[] = [];

    // Add SOL if present
    if (data.nativeBalance > 0) {
      const solBalance = data.nativeBalance / Math.pow(10, DEFAULT_DECIMALS);
      const solPrice = prices.get(SOL_MINT)?.price || 0;
      
      tokens.push({
        address: SOL_MINT,
        symbol: 'SOL',
        name: 'Solana',
        amount: solBalance.toString(),
        price: solPrice.toString(),
        value: (solBalance * solPrice).toString(),
        priceChange24h: (prices.get(SOL_MINT)?.price_change_24h || 0).toString(),
        lastUpdated: new Date(prices.get(SOL_MINT)?.last_updated || Date.now())
      });
    }

    // Add SPL tokens
    if (data.tokens) {
      for (const token of data.tokens) {
        const decimals = token.decimals || DEFAULT_DECIMALS;
        const balance = token.amount / Math.pow(10, decimals);
        const price = prices.get(token.mint)?.price || 0;
        const value = balance * price;

        tokens.push({
          address: token.mint,
          symbol: token.symbol || 'Unknown',
          name: token.name || 'Unknown Token',
          amount: balance.toString(),
          price: price.toString(),
          value: value.toString(),
          priceChange24h: (prices.get(token.mint)?.price_change_24h || 0).toString(),
          lastUpdated: new Date(prices.get(token.mint)?.last_updated || Date.now())
        });
      }
    }

    // Sort by value descending
    const sortedTokens = tokens.sort((a, b) => 
      parseFloat(b.value) - parseFloat(a.value)
    );

    const portfolio = {
      tokens: sortedTokens,
      totalValue: sortedTokens.reduce((sum, t) => sum + parseFloat(t.value), 0),
      change24h: sortedTokens.reduce((sum, t) => sum + parseFloat(t.priceChange24h), 0),
      lastUpdated: Date.now()
    };

    return createApiResponse({ 
      data: portfolio, 
      status: HTTP_STATUS.OK 
    });
  } catch (error) {
    console.error(ERROR_MESSAGES.FETCH_PORTFOLIO_FAILED, error);
    return createApiResponse({ 
      error: ERROR_MESSAGES.FETCH_PORTFOLIO_FAILED,
      status: HTTP_STATUS.SERVER_ERROR 
    });
  }
} 