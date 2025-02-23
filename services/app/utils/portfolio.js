import pool from '../lib/db';
import { logger } from '../lib/logger';
import { balanceHistorySchema } from '../lib/schemas';

export async function savePortfolioSnapshot(wallet, totalValue) {
  try {
    // Validate inputs
    if (!wallet || typeof totalValue !== 'number') {
      logger.warn('Invalid snapshot parameters:', { wallet, totalValue });
      return false;
    }

    const normalizedWallet = wallet.toLowerCase();
    
    try {
      await balanceHistorySchema.validate({ wallet: normalizedWallet });
    } catch (error) {
      logger.warn('Portfolio snapshot validation failed:', { wallet: normalizedWallet, error: error.message });
      return false;
    }

    await pool.query(
      `INSERT INTO portfolio_snapshots (wallet, total_value)
       VALUES ($1, $2)`,
      [normalizedWallet, totalValue]
    );
    logger.info('Portfolio snapshot saved:', { wallet: normalizedWallet, totalValue });
    return true;
  } catch (error) {
    logger.error('Error saving portfolio snapshot:', error);
    return false;
  }
}

export async function getPortfolioHistory(wallet, days = 30) {
  try {
    const normalizedWallet = wallet?.toLowerCase();
    
    // Early validation
    if (!normalizedWallet || normalizedWallet === 'null' || normalizedWallet === 'undefined') {
      logger.warn('Invalid wallet parameter:', normalizedWallet);
      return [];
    }

    // Schema validation
    try {
      await balanceHistorySchema.validate({ wallet: normalizedWallet });
    } catch (error) {
      logger.warn('Portfolio history validation failed:', { wallet: normalizedWallet, error: error.message });
      return [];
    }

    const result = await pool.query(
      `SELECT created_at, balance as total_value
       FROM balance_history
       WHERE wallet = $1
       AND created_at > NOW() - INTERVAL '${days} days'
       ORDER BY created_at DESC`,
      [normalizedWallet]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error fetching portfolio history:', error);
    return [];
  }
} 