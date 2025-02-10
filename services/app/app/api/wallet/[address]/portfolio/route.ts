import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api-utils';
import { PortfolioSchema } from '../../../../../lib/schemas';
import type { Portfolio, TokenBalance } from '@/lib/types';

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;
  
  if (!address) {
    return createApiResponse({
      error: 'Wallet address is required',
      status: 400
    });
  }

  try {
    const tokens = await prisma.tokenBalance.findMany({
      where: {
        walletAddress: address,
        amount: { gt: '0' }  // Use string comparison
      },
      include: {
        token: {
          include: {
            marketData: true  // Get all market data
          }
        }
      }
    });

    if (tokens.length === 0) {
      const emptyPortfolio = {
        tokens: [],
        totalValue: 0,
        change24h: 0,
        lastUpdated: Date.now()
      };
      return createApiResponse({ data: emptyPortfolio, status: 200 });
    }

    // Process the tokens to get latest market data
    const processedTokens = tokens.map(t => {
      const latestMarketData = t.token.marketData.reduce((latest, current) => {
        return !latest || current.updatedAt > latest.updatedAt ? current : latest;
      }, null);

      const price = latestMarketData?.price ?? 0;
      const amount = parseFloat(t.amount) || 0;
      const value = price * amount;
      const priceChange24h = latestMarketData?.priceChange24h ?? 0;

      return {
        address: t.token.address,
        symbol: t.token.symbol || '',
        name: t.token.name || '',
        amount: amount.toString(),
        price: price.toString(),
        value: value.toString(),
        priceChange24h: priceChange24h.toString(),
        lastUpdated: latestMarketData?.updatedAt || new Date()
      };
    });

    const totalValue = calculateTotalValue(processedTokens);
    const change24h = calculatePortfolioChange(processedTokens);

    const portfolioData = {
      tokens: processedTokens,
      totalValue: totalValue.toString(),
      change24h: change24h.toString(),
      lastUpdated: Date.now()
    };

    const validatedPortfolio = PortfolioSchema.parse(portfolioData);
    return createApiResponse({ data: validatedPortfolio, status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}

function calculateTotalValue(tokens: any[]): number {
  return tokens.reduce((sum, t) => sum + (t.value || 0), 0);
}

function calculatePortfolioChange(tokens: any[]): number {
  const totalValue = calculateTotalValue(tokens);
  const previousValue = tokens.reduce((sum, t) => {
    const priceChange = t.priceChange24h || 0;
    const currentValue = t.value || 0;
    return sum + (currentValue / (1 + (priceChange / 100)));
  }, 0);
  
  return previousValue > 0 
    ? ((totalValue - previousValue) / previousValue) * 100 
    : 0;
} 