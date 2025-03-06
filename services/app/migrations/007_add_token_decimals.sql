-- Add token_decimals column to positions table
ALTER TABLE positions ADD COLUMN IF NOT EXISTS token_decimals INTEGER DEFAULT 9;

-- Add token metadata table for caching
CREATE TABLE IF NOT EXISTS token_metadata (
  token_address TEXT PRIMARY KEY,
  name TEXT,
  symbol TEXT,
  decimals INTEGER DEFAULT 9,
  logo_url TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on token address
CREATE INDEX IF NOT EXISTS token_metadata_address_idx ON token_metadata(token_address); 