import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { logger } from '../../../lib/logger';
import { withApiHandler } from '../../../lib/apiHandler';
import { achievementProgressSchema } from '../schemas';
import { cache } from '../../../lib/cache';

export const GET = withApiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet')?.toLowerCase();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  
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
    logger.warn('Achievement validation failed:', { wallet, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const cacheKey = `achievements_${wallet}_${page}_${limit}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT 
        a.id,
        a.achievement_type,
        t.name as achievement_name,
        t.description as achievement_description,
        t.icon as achievement_icon,
        a.token_mint,
        a.created_at,
        ti.symbol as token_symbol,
        COUNT(*) OVER(PARTITION BY a.achievement_type) as achievement_count,
        COUNT(*) OVER() as total_count
      FROM user_achievements a
        INNER JOIN achievement_types t ON t.id = a.achievement_type
        LEFT JOIN token_info ti ON ti.mint = a.token_mint
      WHERE a.wallet = $1
      ORDER BY a.created_at DESC
      OFFSET $2 LIMIT $3`,
      [wallet, offset, limit]
    );

    const response = {
      items: result.rows,
      pagination: {
        page,
        limit,
        total: parseInt(result.rows[0]?.total_count || '0')
      }
    };

    await cache.set(cacheKey, response, 300);
    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to fetch achievements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch achievements' },
      { status: 500 }
    );
  }
}); 