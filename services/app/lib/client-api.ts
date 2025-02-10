import type { Token, MarketData as TokenMarketData, TokenState, Portfolio, PnLData, Transaction } from './types';
import type { ApiErrorResponse } from './types/api';

// Type definitions for API responses
export interface TokenData {
  address: string;
  symbol?: string;
  name?: string;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  holders?: number;
}

export interface MarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  volumeChange24h: number;
  priceChange24h: number;
  totalLiquidity: number;
  holders: number;
  supply: {
    total: string;
    circulating: string;
  };
  lastUpdated: number;
}

// API response types
export interface TokenHistoryData {
  timestamps: number[];
  prices: number[];
  volumes: number[];
}

export interface TokenBalanceData {
  balance: string;
  valueUsd: number;
  priceUsd: number;
}

// API client functions
async function handleApiRequest<T>(response: Response): Promise<{ data?: T; error?: string }> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    return { error: error.message || `HTTP error ${response.status}` };
  }
  const data = await response.json();
  return { data };
}

export async function getTopTradingTokens(): Promise<{ tokens: Token[]; updatedAt: number } | null> {
  try {
    const response = await fetch('/api/tokens/top-trading');
    const { data } = await handleApiRequest<{ tokens: Token[]; updatedAt: number }>(response);
    return data || null;
  } catch (error) {
    console.error('Failed to fetch top trading tokens:', error);
    return null;
  }
}

export async function getTokenState(address: string): Promise<TokenState> {
  try {
    const response = await fetch(`/api/tokens/${address}/state`);
    if (!response.ok) throw new Error('Failed to fetch token state');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch token state:', error);
    return {
      currentLevel: 0,
      currentPrice: 0,
      marketType: 'amm',
      priceLevels: [],
      progress: 0
    };
  }
}

export async function getTokenMarketData(address: string): Promise<MarketData | null> {
  try {
    const response = await fetch(`/api/tokens/${address}/market`);
    const { data } = await handleApiRequest<MarketData>(response);
    return data;
  } catch (error) {
    console.error('Failed to fetch market data:', error);
    return null;
  }
}

export async function searchTokens(query: string, page: number = 1, limit: number = 20): Promise<{ tokens: Token[]; total: number } | null> {
  try {
    const response = await fetch(`/api/tokens/search?q=${query}&page=${page}&limit=${limit}`);
    const { data } = await handleApiRequest<{ tokens: Token[]; total: number }>(response);
    return data;
  } catch (error) {
    console.error('Failed to search tokens:', error);
    return null;
  }
}

export async function getTokenBalance(tokenAddress: string, walletAddress: string): Promise<TokenBalanceData | null> {
  try {
    const response = await fetch(`/api/tokens/${tokenAddress}/balance/${walletAddress}`);
    const { data } = await handleApiRequest<TokenBalanceData>(response);
    return data;
  } catch (error) {
    console.error('Failed to fetch token balance:', error);
    return null;
  }
}

export async function getTokenCreator(tokenAddress: string) {
  const response = await fetch(`/api/tokens/${tokenAddress}/creator`);
  if (!response.ok) throw new Error('Failed to fetch token creator');
  const data = await response.json();
  return data.creator;
}

export async function getTokenHolders(address: string) {
  try {
    const response = await fetch(`/api/tokens/${address}/holders`);
    if (!response.ok) throw new Error('Failed to fetch holders');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch token holders:', error);
    return null;
  }
}

export async function getTokenTransactions(tokenAddress: string, limit = 100, before: string | null = null) {
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (before) params.append('before', before);
  
  const response = await fetch(`/api/tokens/${tokenAddress}/transactions?${params}`);
  if (!response.ok) throw new Error('Failed to fetch token transactions');
  return response.json();
}

export async function getTokenPriceHistory(
  address: string,
  options: PriceHistoryOptions = {}
): Promise<{ timestamp: number; price: number; volume: number }[]> {
  const params = new URLSearchParams({
    interval: options.interval || '1d',
    limit: (options.limit || 100).toString()
  });

  const response = await fetch(`/api/tokens/${address}/price-history?${params}`);
  if (!response.ok) throw new Error('Failed to fetch price history');
  return response.json();
}

export async function getWalletPortfolio(address: string): Promise<Portfolio | null> {
  try {
    const response = await fetch(`/api/wallet/${address}/portfolio`);
    const { data } = await handleApiRequest<Portfolio>(response);
    return data;
  } catch (error) {
    console.error('Failed to fetch portfolio:', error);
    return null;
  }
}

export async function getLatestTokens() {
  const response = await fetch('/api/tokens/top-trading');
  if (!response.ok) throw new Error('Failed to fetch latest tokens');
  return response.json();
}

export interface PriceHistoryOptions {
  interval?: '1h' | '1d' | '1w' | '1m';
  limit?: number;
}

export async function getTokenDetails(address: string) {
  try {
    const response = await fetch(`/api/tokens/${address}`);
    if (!response.ok) throw new Error('Failed to fetch token details');
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch token details:', error);
    return null;
  }
}

export async function getUserPortfolio(address: string) {
  try {
    const response = await fetch(`/api/wallet/${address}/portfolio`);
    return handleApiRequest<Portfolio>(response);
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Failed to fetch portfolio' };
  }
}

export async function getTokenHistory(address: string, days: number = 30): Promise<TokenHistoryData | null> {
  try {
    const response = await fetch(`/api/tokens/${address}/history?days=${days}`);
    const { data } = await handleApiRequest<TokenHistoryData>(response);
    return data;
  } catch (error) {
    console.error('Failed to fetch token history:', error);
    return null;
  }
}

export async function getWalletTransactions(address: string): Promise<{ transactions: Transaction[]; total: number } | null> {
  try {
    const response = await fetch(`/api/wallet/${address}/transactions`);
    const { data } = await handleApiRequest<{ transactions: Transaction[]; total: number }>(response);
    return data;
  } catch (error) {
    console.error('Failed to fetch transactions:', error);
    return null;
  }
}

export async function getWalletPnL(address: string): Promise<PnLData | null> {
  try {
    const response = await fetch(`/api/wallet/${address}/pnl`);
    const { data } = await handleApiRequest<PnLData>(response);
    return data;
  } catch (error) {
    console.error('Failed to fetch PnL:', error);
    return null;
  }
}

export async function getUserPnL(address: string) {
  try {
    const response = await fetch(`/api/wallet/${address}/pnl`);
    return handleApiRequest<PnLData>(response);
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Failed to fetch PnL data' };
  }
}

export async function getUserTransactions(address: string, page = 1, limit = 100) {
  try {
    const response = await fetch(`/api/wallet/${address}/transactions?page=${page}&limit=${limit}`);
    return handleApiRequest<{ transactions: Transaction[]; total: number }>(response);
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Failed to fetch transactions' };
  }
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: number;
}

class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

export async function getEthPrice(): Promise<number> {
  try {
    const response = await fetch('/api/tokens/eth/price');
    const { data } = await handleApiRequest<{ price: number }>(response);
    return data?.price || 0;
  } catch (error) {
    console.error('Failed to fetch ETH price:', error);
    return 0;
  }
}

// Add other API functions as needed... 