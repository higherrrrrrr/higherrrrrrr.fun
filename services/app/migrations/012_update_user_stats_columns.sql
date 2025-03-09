-- Add missing columns to user_stats table
ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS first_trade_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE user_stats
ADD COLUMN IF NOT EXISTS last_trade_at TIMESTAMP WITH TIME ZONE;

-- Set existing values if needed
UPDATE user_stats us
SET 
  first_trade_at = COALESCE(
    (SELECT MIN(block_timestamp) FROM trades t WHERE t.wallet_address = us.wallet_address),
    NOW()
  ),
  last_trade_at = COALESCE(
    (SELECT MAX(block_timestamp) FROM trades t WHERE t.wallet_address = us.wallet_address),
    NOW()
  )
WHERE first_trade_at IS NULL OR last_trade_at IS NULL; 