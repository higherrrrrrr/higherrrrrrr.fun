import pool from '../lib/db';
import { logger } from '../lib/logger';
import { withRetry } from '../lib/retry';

export class AchievementsService {
  static async checkAchievements(userId, wallet, tokenMint, txSignature) {
    const client = await pool.connect();
    let retries = 3;
    
    while (retries > 0) {
      try {
        await client.query('BEGIN');
        const achievements = [];
        
        // Get token info with retry
        const tokenInfo = await withRetry(async () => {
          return await client.query(
            `SELECT created_at, total_accounts, volume_24h,
             CASE WHEN price_change_24h > 20 OR price_change_24h < -20 
             THEN true ELSE false END as is_volatile
             FROM token_info WHERE mint = $1`,
            [tokenMint]
          );
        });

        // Get user's trade progress
        const progress = await client.query(
          `SELECT trade_count, trade_volume, first_purchase_date
           FROM achievement_progress 
           WHERE wallet_address = $1 
           AND token_mint = $2
           FOR UPDATE`,
          [wallet, tokenMint]
        );

        // Check trade-based achievements
        if (progress.rows[0]) {
          const { trade_count, trade_volume } = progress.rows[0];

          // Frequent trader (10+ trades)
          if (trade_count >= 10) {
            achievements.push('FREQUENT_TRADER');
          }

          // Active trader (25+ trades)
          if (trade_count >= 25) {
            achievements.push('ACTIVE_TRADER');
          }

          // Whale trader (volume > 1000 SOL equivalent)
          if (trade_volume >= 1000) {
            achievements.push('WHALE_TRADER');
          }
        }

        // Check token-specific achievements
        if (tokenInfo.rows[0]) {
          // Early buyer check
          const tokenAge = Date.now() - new Date(tokenInfo.rows[0].created_at).getTime();
          if (tokenAge <= 24 * 60 * 60 * 1000) {
            achievements.push('EARLY_BUYER');
          }

          // Pioneer check
          if (tokenInfo.rows[0].total_accounts <= 100) {
            achievements.push('PIONEER');
          }

          // Volatility check
          if (tokenInfo.rows[0].is_volatile) {
            achievements.push('VOLATILITY_MASTER');
          }
        }

        // Diamond hands check (30+ days holding)
        if (progress.rows[0]?.first_purchase_date) {
          const holdingDays = Math.floor(
            (Date.now() - new Date(progress.rows[0].first_purchase_date).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          if (holdingDays >= 30) {
            achievements.push('DIAMOND_HANDS');
          }
        }

        // Save achievements
        for (const type of achievements) {
          await client.query(
            `INSERT INTO user_achievements 
             (user_id, wallet, achievement_type, token_mint, tx_signature)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT DO NOTHING`,
            [userId, wallet, type, tokenMint, txSignature]
          );
        }

        await client.query('COMMIT');
        return achievements;
      } catch (error) {
        await client.query('ROLLBACK');
        logger.error('Failed to check achievements:', error);
        retries--;
        if (retries === 0) throw error;
      }
    }
  }
} 