-- Add total_cost_basis column to positions table
ALTER TABLE positions 
ADD COLUMN IF NOT EXISTS total_cost_basis NUMERIC DEFAULT 0;

-- Initialize total_cost_basis based on existing quantities and cost basis
UPDATE positions
SET total_cost_basis = quantity * avg_cost_basis
WHERE total_cost_basis = 0;

-- Add token_decimals column if not exists
ALTER TABLE positions
ADD COLUMN IF NOT EXISTS token_decimals INTEGER DEFAULT 9;

-- Add side column to trades table
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS side VARCHAR(10);

-- Set default sides based on token_in/token_out
UPDATE trades
SET side = CASE 
  WHEN token_in IS NOT NULL AND amount_in > 0 THEN 'sell'
  WHEN token_out IS NOT NULL AND amount_out > 0 THEN 'buy'
  ELSE NULL
END
WHERE side IS NULL;

-- Make sure realized_pnl exists
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS realized_pnl NUMERIC DEFAULT 0;

-- Add compatibility columns for unified schema
ALTER TABLE trades
ADD COLUMN IF NOT EXISTS token_address VARCHAR(255);

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS amount NUMERIC;

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS price_usd NUMERIC;

ALTER TABLE trades
ADD COLUMN IF NOT EXISTS value_usd NUMERIC;

-- Populate compatibility columns from existing data
UPDATE trades
SET 
  token_address = CASE 
    WHEN side = 'sell' OR side IS NULL AND token_in IS NOT NULL THEN token_in
    ELSE token_out
  END,
  amount = CASE 
    WHEN side = 'sell' OR side IS NULL AND token_in IS NOT NULL THEN amount_in
    ELSE amount_out
  END,
  price_usd = CASE 
    WHEN side = 'sell' OR side IS NULL AND token_in IS NOT NULL THEN price_in_usd
    ELSE price_out_usd
  END,
  value_usd = CASE 
    WHEN side = 'sell' OR side IS NULL AND token_in IS NOT NULL THEN value_in_usd
    ELSE value_out_usd
  END
WHERE token_address IS NULL OR amount IS NULL OR price_usd IS NULL OR value_usd IS NULL;

-- Create index on wallet_address for faster portfolio queries
CREATE INDEX IF NOT EXISTS idx_trades_wallet_address ON trades(wallet_address);
CREATE INDEX IF NOT EXISTS idx_trades_block_timestamp ON trades(block_timestamp);
CREATE INDEX IF NOT EXISTS idx_positions_wallet_address ON positions(wallet_address);