import { logger } from '../../../lib/logger';

const config = {
  // Core contract and API config
  CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1",
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  
  // Token configuration
  BLACKLISTED_TOKENS: [],
  
  // Database configuration (if needed on frontend)
  DATABASE_URL: process.env.DATABASE_URL || "postgresql://localhost/higherrrrrrr",

  // Chain configuration
  RPC_URL: process.env.RPC_URL || 'https://api.mainnet-beta.solana.com',
  
  // Dune Analytics configuration
  DUNE_API_KEY: process.env.DUNE_API_KEY,
  DUNE_QUERY_ID: process.env.NEXT_PUBLIC_DUNE_QUERY_ID || '4709938', // Hardcoded fallback
  DUNE_REFRESH_INTERVAL: 60000, // 1 minute
};

// Add validation
if (!config.DUNE_API_KEY) {
  console.error('DUNE_API_KEY is not configured');
}

if (!config.DUNE_QUERY_ID) {
  console.error('DUNE_QUERY_ID is not configured');
}

if (!config.RPC_URL) {
  logger.warn('RPC_URL not set in environment, using default mainnet endpoint');
}

if (!config.CONTRACT_ADDRESS) {
  console.error('CONTRACT_ADDRESS is not configured');
}

if (!config.DATABASE_URL) {
  console.error('DATABASE_URL is not configured');
}

// Network configuration
export const RPC_URL = config.RPC_URL;

// Achievement configuration
export const ACHIEVEMENT_CONFIG = {
  FREQUENT_TRADER: { minTrades: 10 },
  ACTIVE_TRADER: { minTrades: 25 },
  WHALE_TRADER: { minVolume: 1000 },
  EARLY_BUYER: { maxAgeHours: 24 },
  PIONEER: { maxAccounts: 100 },
  DIAMOND_HANDS: { minHoldDays: 30 }
};

// Cache configuration
export const CACHE_CONFIG = {
  DEFAULT_TTL: 300, // 5 minutes
  LEADERBOARD_TTL: 600, // 10 minutes
  ACHIEVEMENTS_TTL: 300,
  STATS_TTL: 300
};

// Rate limiting configuration (referenced in rate limit middleware)
export const RATE_LIMITS = {
  'api/achievements/check': { max: 100, window: '1m' },
  'api/achievements/leaderboard': { max: 300, window: '5m' },
  'api/achievements/stats': { max: 300, window: '5m' },
  'api/achievements/progress': { max: 300, window: '5m' },
  'api/achievements': { max: 300, window: '5m' },
  'default': { max: 1000, window: '15m' }
};

export default config;