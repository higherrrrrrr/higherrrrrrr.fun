import pool from '../lib/db';
import { logger } from '../lib/logger';

async function cleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    await client.query(
      `DELETE FROM token_metadata WHERE updated_at < NOW() - INTERVAL '7 days'`
    );
    
    await client.query(
      `DELETE FROM portfolio_snapshots WHERE timestamp < NOW() - INTERVAL '90 days'`
    );
    
    await client.query('COMMIT');
    logger.info('Cleanup completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Cleanup failed', error);
  } finally {
    client.release();
  }
}

export default cleanup; 