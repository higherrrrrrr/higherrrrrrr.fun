import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

const redis = await getRedisClient();

export async function GET(request: Request, { params }: { params: { address: string } }) {
  const { address } = params;
  
  try {
    // Try Redis cache first
    const cacheKey = `holders:${address}`;
    let holders = null;
    
    if (redis) {
      holders = await redis.get(cacheKey);
      if (holders) return NextResponse.json(holders);
    }

    // Get token data from database
    const token = await prisma.token.findUnique({
      where: { address },
      include: {
        marketData: true,
      }
    });

    if (!token) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    // Fetch holders from Helius
    const response = await fetch(
      `https://api.helius.xyz/v0/token-accounts?api-key=${process.env.HELIUS_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint: address })
      }
    );

    if (!response.ok) throw new Error('Helius API request failed');
    const data = await response.json();

    // Process holder data
    holders = data.map((account: any) => ({
      address: account.owner,
      amount: account.amount / Math.pow(10, token.decimals),
      percentage: (account.amount / token.totalSupply) * 100
    })).sort((a: any, b: any) => b.amount - a.amount);

    // Cache results
    if (redis) {
      await redis.set(cacheKey, holders, { ex: 300 }); // 5 minute cache
    }

    return NextResponse.json({
      holders,
      totalSupply: token.totalSupply,
      holderCount: holders.length
    });
  } catch (error) {
    console.error('Failed to fetch token holders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token holders' },
      { status: 500 }
    );
  }
} 