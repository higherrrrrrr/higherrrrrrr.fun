import { env } from '@/lib/env.mjs';

// Solana Constants
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const SOL_DECIMALS = 9;
export const DEFAULT_DECIMALS = 9;

// API Endpoints
export const API_ENDPOINTS = {
  HELIUS_BALANCES: (wallet: string) => 
    `https://api.helius.xyz/v0/addresses/${wallet}/balances?api-key=${env.HELIUS_API_KEY}`,
  HELIUS_TOKEN_ACCOUNTS: `https://api.helius.xyz/v0/token-accounts?api-key=${env.HELIUS_API_KEY}`,
  HELIUS_METADATA: `https://api.helius.xyz/v0/token-metadata?api-key=${env.HELIUS_API_KEY}`,
  HELIUS_TRANSACTIONS: (address: string) => 
    `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${env.HELIUS_API_KEY}`,
  GECKOTERMINAL_TOKEN: (address: string) => 
    `${env.GECKOTERMINAL_API_URL}/solana/tokens/${address}`
};

// Cache Keys (add these to existing CACHE_KEYS)
export const CACHE_KEYS = {
  BALANCES: (address: string) => `balances:${address}`,
  BALANCE: (tokenAddress: string, walletAddress: string) => 
    `balance:${tokenAddress}:${walletAddress}`,
  HOLDERS: (address: string) => `holders:${address}`,
  MARKET: (address: string) => `market:${address}`,
  PRICES: (tokens: string[]) => `prices:${tokens.sort().join(',')}`,
  TOKENS_PAGE: (page: number, limit: number) => `tokens:${page}:${limit}`,
  TOKEN_SEARCH: (query: string, page: number, limit: number) => 
    `tokens:search:${query}:${page}:${limit}`,
  PRICE_HISTORY: (address: string, interval: string, limit: number) => 
    `token:${address}:price-history:${interval}:${limit}`,
  TOKEN_HISTORY: (address: string, days: number) => 
    `token:${address}:history:${days}`
};

// Cache Times
export const CACHE_TIMES = {
  WITH_PRICE: 60,          // 1 minute
  WITHOUT_PRICE: 3600,     // 1 hour
  PRICE_HISTORY: 300,      // 5 minutes
  TOKEN_HISTORY: 300       // 5 minutes
};

// Data Sources
export const DATA_SOURCES = {
  GECKOTERMINAL: 'geckoterminal',
  NONE: 'none',
  ERROR: 'error'
};

// Add to existing constants
export const ERROR_MESSAGES = {
  HELIUS_API_FAILED: 'Failed to fetch data from Helius API',
  NO_TOKENS_PROVIDED: 'No tokens provided',
  FETCH_BALANCES_FAILED: 'Failed to fetch balances',
  FETCH_HOLDERS_FAILED: 'Failed to fetch holders',
  FETCH_MARKET_FAILED: 'Failed to fetch market data',
  FETCH_PRICE_FAILED: 'Failed to fetch price data',
  FETCH_HISTORY_FAILED: 'Failed to fetch price history',
  FETCH_TOKEN_FAILED: 'Failed to fetch token data',
  NO_WALLET_ADDRESS: 'Wallet address is required',
  FETCH_PORTFOLIO_FAILED: 'Failed to fetch portfolio data',
  INVALID_ADDRESS: 'Invalid wallet address',
};

export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  SERVER_ERROR: 500
};