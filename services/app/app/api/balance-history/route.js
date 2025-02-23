import { NextResponse } from 'next/server';
import { logger } from '../../../lib/logger';
import { withApiHandler } from '../../../lib/apiHandler';
import { balanceHistorySchema } from '../schemas';
import { cache } from '../../../lib/cache';
import pool from '../../../lib/db';

export const GET = withApiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();

  logger.info('Fetching balance history for wallet:', wallet);

  // Early validation of wallet parameter
  if (!wallet || wallet === 'null' || wallet === 'undefined') {
    logger.warn('Invalid wallet parameter:', wallet);
    return NextResponse.json(
      { error: 'Valid wallet address is required' },
      { status: 400 }
    );
  }

  try {
    // Schema validation for wallet format
    await balanceHistorySchema.validate({ wallet });
  } catch (error) {
    logger.warn('Balance history validation failed:', { wallet, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    const cacheKey = `balance_history_${wallet}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.info('Returning cached balance history for wallet:', wallet);
      return NextResponse.json(cached);
    }

    const result = await pool.query(
      `SELECT created_at, balance as total_value
       FROM balance_history
       WHERE wallet = $1
       ORDER BY created_at DESC
       LIMIT 30`,
      [wallet]
    );

    const data = result.rows;
    if (data.length > 0) {
      await cache.set(cacheKey, data, 300); // Cache for 5 minutes
      logger.info('Cached balance history for wallet:', { wallet, dataPoints: data.length });
    } else {
      logger.info('No balance history found for wallet:', wallet);
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Failed to fetch balance history:', { wallet, error });
    return NextResponse.json(
      { error: 'Failed to fetch balance history' },
      { status: 500 }
    );
  }
}); 