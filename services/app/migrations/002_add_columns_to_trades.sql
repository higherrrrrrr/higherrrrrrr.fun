-- Add price columns
ALTER TABLE trades ADD COLUMN IF NOT EXISTS price_in_usd NUMERIC DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS price_out_usd NUMERIC DEFAULT 0;

-- Add value columns 
ALTER TABLE trades ADD COLUMN IF NOT EXISTS value_in_usd NUMERIC DEFAULT 0;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS value_out_usd NUMERIC DEFAULT 0;

-- Temporarily add fees column (will be removed in the next migration)
ALTER TABLE trades ADD COLUMN IF NOT EXISTS fees NUMERIC DEFAULT 0; 