-- Make token fields nullable to allow single-sided trades (buys/sells)
ALTER TABLE trades 
  ALTER COLUMN token_out DROP NOT NULL;

ALTER TABLE trades 
  ALTER COLUMN amount_out DROP NOT NULL,
  ALTER COLUMN amount_out SET DEFAULT 0;

-- Also make sure we can handle pure buys properly  
ALTER TABLE trades 
  ALTER COLUMN token_in DROP NOT NULL;

ALTER TABLE trades 
  ALTER COLUMN amount_in DROP NOT NULL,
  ALTER COLUMN amount_in SET DEFAULT 0;

-- Update side for any existing trades that might not have it
UPDATE trades
SET side = CASE 
  WHEN token_in IS NOT NULL AND amount_in > 0 THEN 'sell'
  WHEN token_out IS NOT NULL AND amount_out > 0 THEN 'buy'
  ELSE 'unknown'
END
WHERE side IS NULL;

-- Add indexes for performance if not already exists
CREATE INDEX IF NOT EXISTS idx_trades_side ON trades(side); 