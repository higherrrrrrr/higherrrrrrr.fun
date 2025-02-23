import pg from 'pg';
import { logger } from './logger';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost/higherrrrrrr',
  ssl: false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Error handling
pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

pool.on('connect', () => {
  logger.info('Connected to PostgreSQL');
});

export default pool; 