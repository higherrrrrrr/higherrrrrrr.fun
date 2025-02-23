import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { logger } from '../../../lib/logger';
import { withApiHandler } from '../../../lib/apiHandler';

export const GET = withApiHandler(async () => {
  try {
    await pool.query('SELECT 1');
    logger.info('Health check passed');
    return NextResponse.json({ status: 'healthy' });
  } catch (error) {
    logger.error('Health check failed:', error);
    return NextResponse.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}); 