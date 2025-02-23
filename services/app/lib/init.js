import { validateEnv } from './env';
import pool from './db';
import { logger } from './logger';
import { dbConnectionsGauge } from './metrics';

export async function initializeApp() {
  // Validate environment variables
  validateEnv();

  // Test database connection
  try {
    const client = await pool.connect();
    client.release();
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Database connection failed', error);
    process.exit(1);
  }

  // Start metrics collection
  setInterval(async () => {
    const poolStatus = await pool.totalCount();
    dbConnectionsGauge.set(poolStatus);
  }, 5000);
} 