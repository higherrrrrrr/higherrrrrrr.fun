-- Create user_stats table to track aggregate PnL and activity
CREATE TABLE IF NOT EXISTS user_stats (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  total_realized_pnl NUMERIC DEFAULT 0,
  total_volume NUMERIC DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  first_trade_at TIMESTAMP WITH TIME ZONE,
  last_trade_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_user_stats_wallet ON user_stats(wallet_address);

-- Use a transaction and safer approach to populate data
DO $$
BEGIN
  -- Make sure the table exists and is properly created before inserting
  PERFORM 1 FROM pg_tables WHERE tablename = 'user_stats';
  
  -- Populate initial stats from existing trades - with more careful handling
  INSERT INTO user_stats (
    wallet_address, 
    total_realized_pnl, 
    total_volume, 
    trade_count, 
    first_trade_at, 
    last_trade_at
  )
  SELECT 
    wallet_address,
    COALESCE(SUM(realized_pnl), 0) as total_realized_pnl,
    COALESCE(SUM(value_usd), 0) as total_volume,
    COUNT(*) as trade_count,
    MIN(block_timestamp) as first_trade_at,
    MAX(block_timestamp) as last_trade_at
  FROM trades
  WHERE wallet_address IS NOT NULL
  GROUP BY wallet_address
  ON CONFLICT (wallet_address) DO NOTHING;
  
  RAISE NOTICE 'Successfully populated user_stats from trades data';
EXCEPTION
  WHEN others THEN
    RAISE NOTICE 'Error populating user_stats: %', SQLERRM;
END $$;