'use client';
import { useState, useEffect, useCallback } from 'react';
import { tokenCache } from '@/app/services/tokenCache';

export function useTokenInfo(address) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTokenInfo = useCallback(async (forceRefresh = false) => {
    if (!address) return;

    try {
      setLoading(true);
      setError(null);

      // Check cache first if not forcing refresh
      if (!forceRefresh) {
        const cached = tokenCache.get(address);
        if (cached && !tokenCache.isStale(address)) {
          setData(cached);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/token/${address}`);
      
      if (!response.ok) {
        throw new Error(response.status === 404 ? 'No liquidity available' : 'Failed to fetch token info');
      }

      const tokenData = await response.json();
      setData(tokenData);
      
    } catch (err) {
      console.error('useTokenInfo error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    fetchTokenInfo();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTokenInfo(true);
    }, 30000);

    return () => clearInterval(interval);
  }, [address, fetchTokenInfo]);

  return {
    data,
    loading,
    error,
    refresh: () => fetchTokenInfo(true)
  };
} 