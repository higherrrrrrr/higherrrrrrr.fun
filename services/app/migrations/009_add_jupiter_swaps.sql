CREATE TABLE IF NOT EXISTS jupiter_swaps (
  id SERIAL PRIMARY KEY,
  txid VARCHAR(88) NOT NULL UNIQUE,
  input_mint VARCHAR(44) NOT NULL,
  wallet_address VARCHAR(44),
  user_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for query performance
CREATE INDEX IF NOT EXISTS idx_jupiter_swaps_txid ON jupiter_swaps(txid);
CREATE INDEX IF NOT EXISTS idx_jupiter_swaps_wallet ON jupiter_swaps(wallet_address);
CREATE INDEX IF NOT EXISTS idx_jupiter_swaps_input_mint ON jupiter_swaps(input_mint);
CREATE INDEX IF NOT EXISTS idx_jupiter_swaps_created ON jupiter_swaps(created_at); 