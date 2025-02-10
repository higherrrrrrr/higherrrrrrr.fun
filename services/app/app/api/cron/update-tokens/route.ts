import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

const BATCH_SIZE = 50;

export async function GET(request: Request) {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const dbTokens = await prisma.token.findMany({
      select: { address: true },
      where: { active: true }
    });

    const mintAccounts = dbTokens.map(token => token.address);
    
    for (let i = 0; i < mintAccounts.length; i += BATCH_SIZE) {
      const batch = mintAccounts.slice(i, i + BATCH_SIZE);
      
      const response = await fetch(
        `https://api.helius.xyz/v0/token-metadata?api-key=${process.env.HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mintAccounts: batch,
            includeOffChain: true,
            includeMarketData: true
          })
        }
      );

      if (!response.ok) {
        throw new Error(`Helius API failed: ${response.statusText}`);
      }

      const tokens = await response.json();
      await processTokenBatch(tokens);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Token update failed:', error);
    return NextResponse.json({ error: 'Failed to update tokens' }, { status: 500 });
  }
}

async function processTokenBatch(tokens: any[]) {
  // Implementation continues...
} 