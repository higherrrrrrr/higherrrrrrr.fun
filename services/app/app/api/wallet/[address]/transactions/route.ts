import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { createApiResponse, handleApiError } from '@/lib/api-utils';
import { TransactionSchema } from '../../../../../lib/schemas';
import type { Transaction } from '@/lib/types';

export async function GET(
  request: Request,
  context: { params: Promise<{ address: string }> }
) {
  const { address } = await context.params;

  if (!address) {
    return createApiResponse({
      error: 'Address is required',
      status: 400
    });
  }

  try {
    const searchParams = new URL(request.url).searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
      return createApiResponse({
        error: 'Invalid pagination parameters',
        status: 400
      });
    }

    const offset = (page - 1) * limit;

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAddress: address },
          { toAddress: address }
        ]
      },
      include: {
        token: {
          include: {
            marketData: true
          }
        }
      },
      orderBy: {
        timestamp: 'desc'
      },
      skip: offset,
      take: limit
    });

    const formattedTransactions = transactions.map(tx => {
      const latestMarketData = tx.token.marketData.reduce((latest, current) => {
        return !latest || current.updatedAt > latest.updatedAt ? current : latest;
      }, null);

      const price = tx.price || 0;
      const value = tx.value || 0;

      return {
        id: tx.id,
        timestamp: tx.timestamp.getTime(),
        type: tx.fromAddress === address ? 'sell' : 'buy',
        token: {
          address: tx.token.address,
          symbol: tx.token.symbol || '',
          name: tx.token.name || '',
          price: price,
          value: value
        },
        amount: tx.amount,
        fromAddress: tx.fromAddress,
        toAddress: tx.toAddress,
        signature: tx.signature
      };
    });

    return createApiResponse({ 
      data: formattedTransactions,
      status: 200 
    });
  } catch (error) {
    return handleApiError(error);
  }
} 