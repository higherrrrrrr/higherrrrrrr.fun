import { useState, useEffect } from 'react';

export function useTokenMetadata(address) {
  const [data, setData] = useState({
    loading: true,
    error: null,
    metadata: null
  });

  useEffect(() => {
    let mounted = true;

    async function fetchMetadata() {
      if (!address) return;

      try {
        const response = await fetch(`/api/token/${encodeURIComponent(address)}`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `API Error: ${response.status}`);
        }

        if (mounted) {
          setData({
            loading: false,
            error: null,
            metadata: result.metadata
          });
        }
      } catch (error) {
        console.error('Error fetching token metadata:', error);
        if (mounted) {
          setData({
            loading: false,
            error: error.message || 'Failed to load token metadata',
            metadata: null
          });
        }
      }
    }

    fetchMetadata();

    return () => {
      mounted = false;
    };
  }, [address]);

  return data;
} 