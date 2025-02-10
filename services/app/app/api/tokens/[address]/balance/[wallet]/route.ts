import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

const redis = await getRedisClient();

export async function GET(request: Request, { params }: { params: { address: string, wallet: string } }) {
  const { address, wallet } = params;
  
  try {
    // Try Redis cache first
    const cacheKey = `balance:${address}:${wallet}`;
    let balanceData = null;
    
    if (redis) {
      balanceData = await redis.get(cacheKey);
    }

    if (!balanceData) {
      // Get token data from database
      const token = await prisma.token.findUnique({
        where: { address },
        include: {
          marketData: true,
        }
      });

      if (!token) {
        return NextResponse.json({ balance: '0' });
      }

      // Get balance from Helius
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${wallet}/balances?api-key=${process.env.HELIUS_API_KEY}`
      );

      if (!response.ok) throw new Error('Helius API request failed');
      const data = await response.json();
      
      const tokenData = data.tokens?.find(t => t.mint === address);
      const balance = tokenData ? tokenData.amount / Math.pow(10, token.decimals) : 0;

      balanceData = {
        balance: balance.toString(),
        valueUsd: balance * (token.marketData?.price || 0),
        priceUsd: token.marketData?.price || 0
      };

      // Cache results
      if (redis) {
        await redis.set(cacheKey, balanceData, { ex: 60 }); // 1 minute cache
      }
    }

    return NextResponse.json(balanceData);
  } catch (error) {
    console.error('Failed to fetch token balance:', error);
    return NextResponse.json({
      balance: '0',
      valueUsd: 0,
      priceUsd: 0
    });
  }
} 