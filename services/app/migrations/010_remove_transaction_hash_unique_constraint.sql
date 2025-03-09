-- First check if the constraint exists before trying to drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trades_transaction_hash_key' 
    AND conrelid = 'trades'::regclass
  ) THEN
    ALTER TABLE trades DROP CONSTRAINT trades_transaction_hash_key;
  ELSE
    RAISE NOTICE 'Constraint trades_transaction_hash_key does not exist, skipping.';
  END IF;
END $$;

-- Add indexes for performance regardless of constraint existence
CREATE INDEX IF NOT EXISTS idx_trades_transaction_hash ON trades(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_trades_wallet_txhash ON trades(wallet_address, transaction_hash);

-- Update any duplicate records to ensure side is correctly set
UPDATE trades
SET side = CASE 
  WHEN token_in IS NOT NULL AND token_in != '' AND amount_in > 0 THEN 'sell'
  WHEN token_out IS NOT NULL AND token_out != '' AND amount_out > 0 THEN 'buy'
  ELSE 'unknown'
END
WHERE side IS NULL OR side = ''; 