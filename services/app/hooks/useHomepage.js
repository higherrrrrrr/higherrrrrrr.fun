import { useState, useEffect } from 'react';

export function useHomepage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [majorTokens, setMajorTokens] = useState([]);
  const [memeTokens, setMemeTokens] = useState([]);
  const [vcTokens, setVcTokens] = useState([]);
  const [lastFetch, setLastFetch] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function fetchData() {
      // Don't fetch if we've fetched in the last minute
      if (lastFetch && Date.now() - lastFetch < 60000) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/tokens/all');
        if (!response.ok) {
          throw new Error('Failed to fetch token data');
        }

        const data = await response.json();
        
        if (mounted) {
          setMajorTokens(data.major || []);
          setMemeTokens(data.meme || []);
          setVcTokens(data.vc || []);
          setLastFetch(Date.now());
        }
      } catch (err) {
        console.error('Error fetching homepage data:', err);
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      mounted = false;
    };
  }, [lastFetch]);

  return {
    majorTokens,
    memeTokens,
    vcTokens,
    loading,
    error
  };
} 