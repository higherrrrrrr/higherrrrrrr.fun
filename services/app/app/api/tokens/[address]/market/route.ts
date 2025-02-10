import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { createApiResponse, handleApiError } from '@/lib/api-utils';
import type { MarketData } from '@/lib/types';

const redis = await getRedisClient();

export async function GET(
  request: Request,
  { params }: { params: { address: string } }
) {
  const { address } = params;
  
  try {
    const cacheKey = `token:${address}:market`;
    let marketData: MarketData | null = null;
    
    if (redis) {
      marketData = await redis.get(cacheKey);
      if (marketData) {
        return createApiResponse({ data: marketData, status: 200 });
      }
    }

    // First try to get fresh data from Helius
    const heliusResponse = await fetch(
      `https://api.helius.xyz/v0/token-metadata?api-key=${process.env.HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mintAccounts: [address],
          includeOffChain: false,
          includeMarketData: true
        })
      }
    );

    if (heliusResponse.ok) {
      const [heliusToken] = await heliusResponse.json();
      
      if (heliusToken?.marketData) {
        // Get additional data from database
        const dbToken = await prisma.token.findUnique({
          where: { address },
          include: {
            marketData: {
              orderBy: { updatedAt: 'desc' },
              take: 1
            }
          }
        });

        marketData = {
          price: heliusToken.marketData.price || 0,
          marketCap: heliusToken.marketData.marketCap || 0,
          volume24h: heliusToken.marketData.volume24h || 0,
          volumeChange24h: heliusToken.marketData.volumeChange24h || 0,
          priceChange24h: heliusToken.marketData.priceChange24h || 0,
          // Use database values for fields not available in Helius
          priceChange7d: dbToken?.marketData[0]?.priceChange7d || 0,
          priceChange30d: dbToken?.marketData[0]?.priceChange30d || 0,
          volume7d: dbToken?.marketData[0]?.volume7d || 0,
          volume30d: dbToken?.marketData[0]?.volume30d || 0,
          totalLiquidity: dbToken?.marketData[0]?.totalLiquidity || 0,
          holders: heliusToken.ownership?.holderCount || dbToken?.marketData[0]?.holders || 0,
          supply: {
            total: heliusToken.supply?.total || dbToken?.marketData[0]?.totalSupply || '0',
            circulating: heliusToken.supply?.circulating || dbToken?.marketData[0]?.circulatingSupply || '0'
          },
          lastUpdated: Date.now()
        };

        // Cache the combined data
        if (redis) {
          await redis.set(cacheKey, marketData, { ex: 60 });
        }

        return createApiResponse({ data: marketData, status: 200 });
      }
    }

    // Fallback to database if Helius fails or returns no data
    const token = await prisma.token.findUnique({
      where: { address },
      include: {
        marketData: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!token?.marketData?.[0]) {
      return createApiResponse({
        error: 'Market data not found',
        status: 404
      });
    }

    // Use database data as fallback
    marketData = {
      price: token.marketData[0].price || 0,
      marketCap: token.marketData[0].marketCap || 0,
      volume24h: token.marketData[0].volume24h || 0,
      volumeChange24h: token.marketData[0].volumeChange24h || 0,
      priceChange24h: token.marketData[0].priceChange24h || 0,
      priceChange7d: token.marketData[0].priceChange7d || 0,
      priceChange30d: token.marketData[0].priceChange30d || 0,
      volume7d: token.marketData[0].volume7d || 0,
      volume30d: token.marketData[0].volume30d || 0,
      totalLiquidity: token.marketData[0].totalLiquidity || 0,
      holders: token.marketData[0].holders || 0,
      supply: {
        total: token.marketData[0].totalSupply || '0',
        circulating: token.marketData[0].circulatingSupply || '0'
      },
      lastUpdated: token.marketData[0].updatedAt.getTime()
    };

    if (redis) {
      await redis.set(cacheKey, marketData, { ex: 60 });
    }

    return createApiResponse({ data: marketData, status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
} 