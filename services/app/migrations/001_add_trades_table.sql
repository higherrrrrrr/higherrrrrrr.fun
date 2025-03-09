-- Create trades table for tracking Jupiter swaps
CREATE TABLE IF NOT EXISTS trades (
  id SERIAL PRIMARY KEY,
  transaction_hash TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL,
  token_in TEXT NOT NULL,
  token_out TEXT NOT NULL,
  amount_in NUMERIC NOT NULL,
  amount_out NUMERIC NOT NULL,
  block_timestamp TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for wallet address for faster lookups
CREATE INDEX IF NOT EXISTS trades_wallet_address_idx 
ON trades(wallet_address);

-- Create index for transaction hash for faster lookups
CREATE INDEX IF NOT EXISTS trades_transaction_hash_idx 
ON trades(transaction_hash);