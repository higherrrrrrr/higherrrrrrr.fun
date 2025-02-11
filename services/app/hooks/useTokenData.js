import { useState, useEffect } from 'react';
import { priceService } from '@/lib/price-service';

export function useTokenData(address) {
  const [tokenState, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshTokenState = async () => {
    if (!address) return;
    try {
      const allTokens = await priceService.getAllTokens();
      const token = allTokens.find(t => t.address === address);
      if (token) {
        setTokenState({
          price: token.price,
          priceChange24h: token.price_change_24h,
          volume24h: token.volume_24h,
          marketCap: token.market_cap,
          lastUpdated: token.last_updated,
          source: 'geckoterminal'
        });
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch token state:', err);
      setError(err);
    }
  };

  useEffect(() => {
    if (address) {
      setLoading(true);
      refreshTokenState()
        .finally(() => setLoading(false));

      const tokenRefreshTimer = setInterval(refreshTokenState, 30000);
      return () => clearInterval(tokenRefreshTimer);
    }
  }, [address]);

  return {
    tokenState,
    loading,
    error,
    refreshTokenState
  };
} 