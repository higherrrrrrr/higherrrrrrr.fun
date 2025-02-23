import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { logger } from '../../../../lib/logger';
import { withApiHandler } from '../../../../lib/apiHandler';
import { achievementProgressSchema } from '../../schemas';
import { cache } from '../../../../lib/cache';

export const GET = withApiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();

  if (!wallet || wallet === 'null' || wallet === 'undefined') {
    logger.warn('Invalid wallet parameter:', wallet);
    return NextResponse.json(
      { error: 'Valid wallet address is required' },
      { status: 400 }
    );
  }

  try {
    await achievementProgressSchema.validate({ wallet });
  } catch (error) {
    logger.warn('Achievement progress validation failed:', { wallet, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    const cacheKey = `progress_${wallet}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT * FROM achievement_progress
         WHERE wallet_address = $1`,
        [wallet]
      );
      const data = result.rows[0] || null;
      await cache.set(cacheKey, data, 300); // Cache for 5 minutes
      return NextResponse.json(data);
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Failed to fetch achievement progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievement progress' },
      { status: 500 }
    );
  }
}); 