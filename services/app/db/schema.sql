-- Drop existing tables if needed for clean migration
DROP TABLE IF EXISTS conviction_holders;
DROP TABLE IF EXISTS evolution_thresholds;
DROP TABLE IF EXISTS tokens;

-- Create tokens table with all required fields
CREATE TABLE IF NOT EXISTS tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mint_address TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    symbol TEXT NOT NULL,
    total_supply NUMERIC NOT NULL,
    circulating_supply NUMERIC,
    market_cap NUMERIC,
    volume_24h NUMERIC,
    current_price NUMERIC,
    holders_count INTEGER,
    distribution_category TEXT CHECK(distribution_category IN ('excellent', 'fair', 'sketch')),
    evolution_level INTEGER DEFAULT 0,
    next_evolution_threshold NUMERIC,
    launch_date TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Add indexes for commonly queried fields
    CONSTRAINT valid_supply CHECK (total_supply > 0),
    CONSTRAINT valid_market_cap CHECK (market_cap >= 0),
    CONSTRAINT valid_volume CHECK (volume_24h >= 0),
    CONSTRAINT valid_holders CHECK (holders_count >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_tokens_market_cap ON tokens(market_cap DESC);
CREATE INDEX idx_tokens_volume_24h ON tokens(volume_24h DESC);
CREATE INDEX idx_tokens_launch_date ON tokens(launch_date DESC);
CREATE INDEX idx_tokens_holders_count ON tokens(holders_count DESC);
CREATE INDEX idx_tokens_search ON tokens(name, symbol, mint_address);

-- Create evolution_thresholds table for tracking token evolution states
CREATE TABLE IF NOT EXISTS evolution_thresholds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mint_address TEXT NOT NULL,
    threshold_price NUMERIC NOT NULL,
    new_name TEXT NOT NULL,
    new_uri TEXT NOT NULL,
    achieved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(mint_address) REFERENCES tokens(mint_address) ON DELETE CASCADE,
    CONSTRAINT valid_threshold CHECK (threshold_price > 0)
);

-- Create conviction_holders table for tracking NFT-eligible addresses
CREATE TABLE IF NOT EXISTS conviction_holders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mint_address TEXT NOT NULL,
    holder_address TEXT NOT NULL,
    token_amount NUMERIC NOT NULL,
    percentage_held NUMERIC NOT NULL,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(mint_address) REFERENCES tokens(mint_address) ON DELETE CASCADE,
    CONSTRAINT valid_amount CHECK (token_amount > 0),
    CONSTRAINT valid_percentage CHECK (percentage_held > 0 AND percentage_held <= 100),
    UNIQUE(mint_address, holder_address)
);

-- Create indexes for related tables
CREATE INDEX idx_evolution_mint ON evolution_thresholds(mint_address);
CREATE INDEX idx_conviction_mint ON conviction_holders(mint_address);
CREATE INDEX idx_conviction_holder ON conviction_holders(holder_address);