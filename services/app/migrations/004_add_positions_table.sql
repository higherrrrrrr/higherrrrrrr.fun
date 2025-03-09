-- services/app/migrations/002_add_positions_table.sql
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_address TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  avg_cost_basis NUMERIC NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC NOT NULL DEFAULT 0,
  last_price NUMERIC NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index for wallet+token combination
CREATE UNIQUE INDEX IF NOT EXISTS positions_wallet_token_idx 
ON positions(wallet_address, token_address);