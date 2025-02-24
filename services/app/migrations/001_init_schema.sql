-- Drop existing tables if they exist
DROP TABLE IF EXISTS rate_limits;
DROP TABLE IF EXISTS asset_cache;
DROP TABLE IF EXISTS token_metadata;
DROP TABLE IF EXISTS user_achievements;
DROP TABLE IF EXISTS achievement_progress;
DROP TABLE IF EXISTS achievement_types;
DROP TABLE IF EXISTS wallet_balance_history;
DROP TABLE IF EXISTS token_info;
DROP TABLE IF EXISTS cache;

-- Create tables in order of dependencies
CREATE TABLE rate_limits (
  ip TEXT NOT NULL,
  path TEXT NOT NULL,
  requests INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ip, path)
);

CREATE TABLE asset_cache (
  wallet TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE token_metadata (
  mint VARCHAR(44) PRIMARY KEY,
  metadata JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE token_info (
  mint VARCHAR(44) PRIMARY KEY,
  name VARCHAR(100),
  symbol VARCHAR(20),
  volume_24h DECIMAL,
  trades_24h INTEGER,
  total_accounts INTEGER,
  price_change_24h DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE,
  decimals INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE achievement_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(255),
  target_value INTEGER,
  target_type VARCHAR(20)
);

CREATE TABLE user_achievements (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(44) NOT NULL,
  wallet VARCHAR(44) NOT NULL,
  achievement_type VARCHAR(50) REFERENCES achievement_types(id),
  token_mint VARCHAR(44),
  tx_signature VARCHAR(88),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(wallet, achievement_type, token_mint)
);

CREATE TABLE achievement_progress (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  achievement_id VARCHAR(50) REFERENCES achievement_types(id),
  token_mint VARCHAR(44),
  progress INTEGER NOT NULL DEFAULT 0,
  trade_volume DECIMAL DEFAULT 0,
  trade_count INTEGER DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(wallet_address, achievement_id)
);

CREATE TABLE wallet_balance_history (
  id SERIAL PRIMARY KEY,
  wallet_address VARCHAR(44) NOT NULL,
  total_value DECIMAL NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cache (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create all indexes
CREATE INDEX idx_rate_limits_window ON rate_limits(window_start);
CREATE INDEX idx_asset_cache_created_at ON asset_cache(created_at);
CREATE INDEX idx_token_metadata_updated ON token_metadata(updated_at);
CREATE INDEX idx_token_info_updated ON token_info(updated_at);
CREATE INDEX idx_user_achievements_wallet ON user_achievements(wallet);
CREATE INDEX idx_user_achievements_created ON user_achievements(created_at DESC);
CREATE INDEX idx_achievement_progress_wallet ON achievement_progress(wallet_address);
CREATE INDEX idx_achievement_progress_updated ON achievement_progress(updated_at DESC);
CREATE INDEX idx_wallet_balance_history_wallet ON wallet_balance_history(wallet_address);
CREATE INDEX idx_wallet_balance_history_created ON wallet_balance_history(created_at);
CREATE INDEX idx_cache_expires ON cache(expires_at);
CREATE INDEX idx_achievement_progress_wallet_token 
ON achievement_progress(wallet_address, token_mint);

-- For volume leaderboard
CREATE INDEX idx_achievement_progress_volume ON achievement_progress(updated_at DESC, trade_volume DESC);

-- For trades leaderboard
CREATE INDEX idx_achievement_progress_trades ON achievement_progress(updated_at DESC, trade_count DESC);

-- For achievements leaderboard
CREATE INDEX idx_user_achievements_count ON user_achievements(created_at DESC, achievement_type); 