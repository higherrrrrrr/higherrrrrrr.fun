import { NextResponse } from 'next/server';
import { AchievementsService } from '../../../../services/achievements';
import pool from '../../../../lib/db';
import { logger } from '../../../../lib/logger';
import { withApiHandler } from '../../../../lib/apiHandler';
import { achievementSchema } from '../../schemas';
import { withRetry } from '../../../../lib/retry';
import { sanitizeInput } from '../../middleware/sanitize';

export const POST = withApiHandler(async (request) => {
  const body = await request.json();
  const sanitizedData = {
    wallet: sanitizeInput(body.wallet)?.toLowerCase(),
    tokenMint: sanitizeInput(body.tokenMint),
    txSignature: sanitizeInput(body.txSignature),
    volume: parseFloat(sanitizeInput(body.volume)) || 0
  };
  
  try {
    await achievementSchema.validate(sanitizedData);
  } catch (error) {
    logger.warn('Achievement validation failed:', { data: sanitizedData, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const achievements = await withRetry(() => 
      AchievementsService.checkAchievements(
        null, 
        sanitizedData.wallet, 
        sanitizedData.tokenMint, 
        sanitizedData.txSignature
      )
    );

    // Update trade count and volume
    if (sanitizedData.volume > 0) {
      await client.query(`
        INSERT INTO achievement_progress (
          wallet_address, 
          token_mint, 
          trade_count, 
          trade_volume,
          first_purchase_date,
          created_at, 
          updated_at
        )
        VALUES (
          $1, $2, 1, $3,
          CASE 
            WHEN NOT EXISTS (
              SELECT 1 FROM achievement_progress 
              WHERE wallet_address = $1 AND token_mint = $2
            ) THEN NOW() 
            ELSE (
              SELECT first_purchase_date 
              FROM achievement_progress 
              WHERE wallet_address = $1 AND token_mint = $2
            )
          END,
          NOW(), NOW()
        )
        ON CONFLICT (wallet_address, token_mint) 
        DO UPDATE SET
          trade_count = achievement_progress.trade_count + 1,
          trade_volume = achievement_progress.trade_volume + EXCLUDED.trade_volume,
          updated_at = NOW()
      `, [sanitizedData.wallet, sanitizedData.tokenMint, sanitizedData.volume]);
    }

    const result = await client.query(
      `SELECT * FROM achievement_progress
       WHERE wallet_address = $1
         AND token_mint = $2`,
      [sanitizedData.wallet, sanitizedData.tokenMint]
    );

    await client.query('COMMIT');

    return NextResponse.json({ 
      success: true, 
      achievements,
      progress: result.rows[0] || null
    });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Failed to check achievements:', error);
    return NextResponse.json(
      { error: 'Failed to check achievements' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}); 