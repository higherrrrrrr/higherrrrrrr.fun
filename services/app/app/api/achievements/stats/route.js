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
    logger.warn('Achievement stats validation failed:', { wallet, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    const cacheKey = `stats_${wallet}`;
    const cached = await cache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const result = await pool.query(
      `WITH achievement_stats AS (
          SELECT COUNT(DISTINCT achievement_type) as achievement_count
          FROM user_achievements
          WHERE wallet = $1
        ),
        trade_stats AS (
          SELECT 
            COALESCE(SUM(trade_volume), 0) as total_volume,
            COALESCE(SUM(trade_count), 0) as total_trades
          FROM achievement_progress
          WHERE wallet_address = $1
        )
        SELECT 
          a.achievement_count,
          t.total_volume,
          t.total_trades
        FROM achievement_stats a
        CROSS JOIN trade_stats t`,
        [wallet]
    );

    await cache.set(cacheKey, result.rows[0], 300);
    return NextResponse.json(result.rows[0]);
  } catch (error) {
    logger.error('Failed to fetch user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}); 