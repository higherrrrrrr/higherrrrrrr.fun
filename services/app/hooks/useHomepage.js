import { useState, useEffect } from 'react';
import { processTokens } from '../utils/tokenProcessing';

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
        
        // Process all tokens together to ensure proper duplicate detection
        const allTokens = [...(data.major || []), ...(data.meme || []), ...(data.vc || [])];
        const processedTokens = processTokens(allTokens);
        
        // Split processed tokens back into their categories
        if (mounted) {
          setMajorTokens(processedTokens.filter(token => data.major?.some(t => t.address === token.address) ?? false));
          setMemeTokens(processedTokens.filter(token => data.meme?.some(t => t.address === token.address) ?? false));
          setVcTokens(processedTokens.filter(token => data.vc?.some(t => t.address === token.address) ?? false));
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