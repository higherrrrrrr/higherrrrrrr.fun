import type { TokenData, MarketData, Portfolio, PnLData, Transaction } from '@/lib/types';

export interface ApiErrorResponse {
  error: string;
  status: number;
}

export interface TokenSearchResponse {
  tokens: TokenData[];
  total: number;
}

export interface TokenBalanceResponse {
  balance: string;
  value: number;
}

export interface TokenHoldersResponse {
  holders: number;
  distribution: {
    range: string;
    count: number;
  }[];
}

export interface WalletPortfolioResponse extends Portfolio {
  lastUpdated: number;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  nextCursor?: string;
} 