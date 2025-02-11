import { useState, useEffect, useCallback } from 'react';
import type { TokenBalance } from '@/lib/types';

const REFRESH_INTERVAL = 60000; // 1 minute
const MIN_USD_VALUE = 0.01;

export function usePortfolioData(address: string | null) {
  const [portfolio, setPortfolio] = useState<{
    tokens: TokenBalance[];
    totalValue: number;
    change24h: number;
    lastUpdated: number;
  }>({
    tokens: [],
    totalValue: 0,
    change24h: 0,
    lastUpdated: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchPortfolio = useCallback(async () => {
    if (!address) return;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/wallet/${address}/portfolio`);
      const result = await response.json();

      if (result.error) {
        throw new Error(result.error);
      }

      // Handle the new response format with data wrapper
      const portfolioData = result.data;

      // Filter out low value tokens
      const significantTokens = portfolioData.tokens.filter(
        (token: TokenBalance) => parseFloat(token.value) >= MIN_USD_VALUE
      );

      setPortfolio({
        ...portfolioData,
        tokens: significantTokens
      });
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      setError(error as Error);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    if (!address) {
      setPortfolio({
        tokens: [],
        totalValue: 0,
        change24h: 0,
        lastUpdated: 0
      });
      return;
    }

    // Initial fetch
    fetchPortfolio();

    // Set up polling interval
    const intervalId = setInterval(fetchPortfolio, REFRESH_INTERVAL);

    // Cleanup
    return () => clearInterval(intervalId);
  }, [address, fetchPortfolio]);

  return {
    ...portfolio,
    isLoading,
    error,
    refetch: fetchPortfolio
  };
} 