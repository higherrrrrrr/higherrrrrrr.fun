import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';

const redis = await getRedisClient();

export async function GET(request: Request, { params }: { params: { address: string } }) {
  const { address } = params;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '100');
  const before = searchParams.get('before');
  
  try {
    // Try Redis cache first
    const cacheKey = `transactions:${address}:${limit}:${before || 'latest'}`;
    let transactions = null;
    
    if (redis) {
      transactions = await redis.get(cacheKey);
    }

    if (!transactions) {
      // If no cache, fetch from Helius
      const response = await fetch(
        `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${process.env.HELIUS_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: {
              accounts: [address],
              startSlot: before ? parseInt(before) : undefined,
              limit: limit,
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

      if (!response.ok) throw new Error('Helius API request failed');
      const data = await response.json();

      transactions = data.map(tx => ({
        signature: tx.signature,
        slot: tx.slot,
        timestamp: tx.timestamp,
        type: tx.type,
        fee: tx.fee,
        status: tx.status,
        signer: tx.feePayer,
        tokenTransfers: tx.tokenTransfers?.map(transfer => ({
          fromAddress: transfer.fromUserAccount,
          toAddress: transfer.toUserAccount,
          amount: transfer.tokenAmount,
          decimals: transfer.decimals,
          mint: transfer.mint,
        })) || [],
        preTokenBalances: tx.preTokenBalances,
        postTokenBalances: tx.postTokenBalances,
      }));

      // Cache results
      if (redis) {
        await redis.set(cacheKey, transactions, { ex: 60 }); // 1 minute cache
      }
    }

    // Get the cursor for the next page
    const lastTx = transactions[transactions.length - 1];
    const nextCursor = lastTx ? lastTx.slot : null;

    return NextResponse.json({
      transactions,
      nextCursor
    });
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
} 