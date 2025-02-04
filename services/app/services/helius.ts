import axios, { AxiosError } from 'axios';
import rateLimit from 'axios-rate-limit';
import axiosRetry from 'axios-retry';
import { TokenData, HolderData } from '../types';

const HELIUS_API_KEY = process.env.HELIUS_API_KEY;
const BASE_URL = 'https://api.helius.xyz/v0';

if (!HELIUS_API_KEY) {
  throw new Error('HELIUS_API_KEY is not set in environment variables');
}

// Create rate-limited axios instance
const http = rateLimit(axios.create(), { 
  maxRequests: 50,
  perMilliseconds: 1000 
});

// Add retry logic
axiosRetry(http, { 
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error: AxiosError) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) || 
           error.response?.status === 429; // Retry on rate limit
  }
});

/**
 * Fetch metadata for a list of mint addresses
 */
export async function getTokenMetadata(mintAddresses: string[]) {
  try {
    const response = await http.post(`${BASE_URL}/token-metadata`, {
      mintAccounts: mintAddresses,
      includeOffChain: true,
      disableCache: false,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (error.response?.status === 401) {
        throw new Error('Invalid Helius API key.');
      }
      throw new Error(`Helius API error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Get holder data for a specific mint
 */
export async function getTokenHolders(mintAddress: string) {
  try {
    const response = await http.get(`${BASE_URL}/token-holdings`, {
      params: {
        mintAccount: mintAddress,
      },
      headers: {
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error(`Token ${mintAddress} not found`);
      }
      throw new Error(`Error fetching holders: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Search for tokens by name, symbol, or mint address
 */
export async function searchTokens(query: string) {
  try {
    const response = await http.get(`${BASE_URL}/token-metadata`, {
      params: {
        query: encodeURIComponent(query),
      },
      headers: {
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Search error: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Get balances and token accounts for a specific mint
 */
export async function getTokenAccounts(mintAddress: string) {
  try {
    const response = await http.get(`${BASE_URL}/token-accounts`, {
      params: {
        mintAccount: mintAddress,
      },
      headers: {
        'Authorization': `Bearer ${HELIUS_API_KEY}`
      }
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Error fetching token accounts: ${error.response?.data?.message || error.message}`);
    }
    throw error;
  }
}

/**
 * Calculate distribution category based on holder data
 */
export function calculateDistributionCategory(holders: HolderData[]): 'excellent' | 'fair' | 'sketch' {
  try {
    const totalSupply = holders.reduce((sum, h) => sum + h.amount, 0);
    const topHoldersAmount = holders
      .filter(h => !h.isTreasury)
      .slice(0, 10)
      .reduce((sum, h) => sum + h.amount, 0);
    
    const topHoldersPercentage = (topHoldersAmount / totalSupply) * 100;

    if (topHoldersPercentage < 20) return 'excellent';
    if (topHoldersPercentage <= 50) return 'fair';
    return 'sketch';
  } catch (error) {
    console.error('Error calculating distribution category:', error);
    return 'sketch'; // Default to sketch if calculation fails
  }
}

/**
 * Format token data for database storage
 */
export function formatTokenData(data: any): Partial<TokenData> {
  return {
    mintAddress: data.mintAddress,
    name: data.name,
    symbol: data.symbol,
    totalSupply: data.supply,
    circulatingSupply: data.circulatingSupply,
    marketCap: data.marketCap,
    volume24h: data.volume24h,
    currentPrice: data.currentPrice,
    holdersCount: data.holdersCount,
    launchDate: data.launchDate ? new Date(data.launchDate) : undefined,
    updatedAt: new Date()
  };
}
