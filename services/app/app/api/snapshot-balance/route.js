import { NextResponse } from 'next/server';
import { withApiHandler } from '../../../lib/apiHandler';
import { logger } from '../../../lib/logger';
import pool from '../../../lib/db';
import { snapshotBalanceSchema } from '../schemas';

export const POST = withApiHandler(async (request) => {
  const body = await request.json();
  const sanitizedData = {
    wallet: sanitizeInput(body.wallet)?.toLowerCase(),
    totalValue: parseFloat(sanitizeInput(body.totalValue)) || 0
  };

  try {
    await snapshotBalanceSchema.validate(sanitizedData);
  } catch (error) {
    logger.warn('Snapshot validation failed:', { data: sanitizedData, error: error.message });
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  try {
    await pool.query(
      `INSERT INTO wallet_balance_history (wallet_address, total_value)
       SELECT $1, $2
       WHERE NOT EXISTS (
         SELECT 1 FROM wallet_balance_history
         WHERE wallet_address = $1
         AND created_at > NOW() - INTERVAL '1 hour'
       )`,
      [sanitizedData.wallet, sanitizedData.totalValue]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error.constraint === 'unique_wallet_timewindow') {
      return NextResponse.json(
        { error: 'Balance snapshot already recorded within the last hour' },
        { status: 429 }
      );
    }
    
    logger.error('Failed to snapshot balance:', error);
    return NextResponse.json(
      { error: 'Failed to snapshot balance' },
      { status: 500 }
    );
  }
}); 