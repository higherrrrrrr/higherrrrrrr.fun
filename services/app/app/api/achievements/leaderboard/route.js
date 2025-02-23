import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { logger } from '../../../../lib/logger';
import { withApiHandler } from '../../../../lib/apiHandler';
import { leaderboardSchema } from '../../schemas';
import { cache } from '../../../../lib/cache';
import { sanitizeInput } from '../../middleware/sanitize';

export const GET = withApiHandler(async (request) => {
  const { searchParams } = new URL(request.url);
  const timeframe = sanitizeInput(searchParams.get('timeframe'));
  const type = sanitizeInput(searchParams.get('type'));
  
  try {
    await leaderboardSchema.validate({ timeframe, type });
  } catch (error) {
    logger.warn('Leaderboard validation failed:', { timeframe, type, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const offset = (page - 1) * limit;
  
  const cacheKey = `leaderboard_${type}_${timeframe}_${page}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    let query;
    let params = [];
    
    switch (type) {
      case 'volume':
        query = `
          SELECT 
            ap.wallet_address,
            SUM(ap.trade_volume) as total_volume,
            COUNT(DISTINCT ap.token_mint) as tokens_traded,
            MAX(ap.updated_at) as last_trade
          FROM achievement_progress ap
          WHERE ap.updated_at > NOW() - 
            CASE 
              WHEN $1 = '7d' THEN INTERVAL '7 days'
              WHEN $1 = '30d' THEN INTERVAL '30 days'
              ELSE INTERVAL '100 years'
            END
          GROUP BY ap.wallet_address
          ORDER BY total_volume DESC
          LIMIT 100
        `;
        params = [timeframe];
        break;

      case 'trades':
        query = `
          SELECT 
            ap.wallet_address,
            SUM(ap.trade_count) as total_trades,
            COUNT(DISTINCT ap.token_mint) as tokens_traded,
            MAX(ap.updated_at) as last_trade
          FROM achievement_progress ap
          WHERE ap.updated_at > NOW() - 
            CASE 
              WHEN $1 = '7d' THEN INTERVAL '7 days'
              WHEN $1 = '30d' THEN INTERVAL '30 days'
              ELSE INTERVAL '100 years'
            END
          GROUP BY ap.wallet_address
          ORDER BY total_trades DESC
          LIMIT 100
        `;
        params = [timeframe];
        break;

      case 'achievements':
        query = `
          SELECT 
            ua.wallet_address,
            COUNT(DISTINCT ua.achievement_type) as achievement_count,
            array_agg(DISTINCT at.icon) as achievement_icons,
            MAX(ua.created_at) as last_achievement
          FROM user_achievements ua
          JOIN achievement_types at ON at.id = ua.achievement_type
          WHERE ua.created_at > NOW() - 
            CASE 
              WHEN $1 = '7d' THEN INTERVAL '7 days'
              WHEN $1 = '30d' THEN INTERVAL '30 days'
              ELSE INTERVAL '100 years'
            END
          GROUP BY ua.wallet_address
          ORDER BY achievement_count DESC
          LIMIT 100
        `;
        params = [timeframe];
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid leaderboard type' },
          { status: 400 }
        );
    }

    // Modify queries to include pagination
    query += ` OFFSET $2 LIMIT $3`;
    params = [timeframe, offset, limit];

    const result = await pool.query(query, params);
    await cache.set(cacheKey, result.rows, 300);
    return NextResponse.json(result.rows);
  } catch (error) {
    logger.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
});