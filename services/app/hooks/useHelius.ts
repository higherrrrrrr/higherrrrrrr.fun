import { useState, useEffect } from 'react';
import { helius } from '@/lib/helius';
import type { HeliusToken } from '@/lib/types';

const calculateWhaleScore = (whaleCount: number): number => {
  if (whaleCount >= 100) return 5;
  if (whaleCount >= 50) return 4;
  if (whaleCount >= 20) return 3;
  if (whaleCount >= 10) return 2;
  if (whaleCount >= 1) return 1;
  return 0;
};

export function useHeliusTokens(addresses: string[]) {
  const [tokens, setTokens] = useState<HeliusToken[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    async function fetchTokens() {
      try {
        if (!addresses.length) {
          setTokens([]);
          return;
        }

        // Fetch tokens in batches of 100 to avoid rate limits
        const batchSize = 100;
        const batches = [];
        
        for (let i = 0; i < addresses.length; i += batchSize) {
          const batch = addresses.slice(i, i + batchSize);
          batches.push(batch);
        }

        const allTokens: HeliusToken[] = [];

        for (const batch of batches) {
          const responses = await Promise.all(
            batch.map(address => 
              helius.rpc.getAsset({
                id: address,
                displayOptions: { showFungible: true }
              }).catch(err => {
                console.error(`Failed to fetch token ${address}:`, err);
                return null;
              })
            )
          );

          const validTokens = responses
            .filter((res): res is NonNullable<typeof res> => res !== null)
            .map(response => ({
              address: response.id,
              symbol: response.content?.metadata?.symbol || 'Unknown',
              name: response.content?.metadata?.name || 'Unknown Token',
              price: response.price || 0,
              priceChange1h: response.priceChange?.h1 || 0,
              priceChange24h: response.priceChange?.h24 || 0,
              priceChange7d: response.priceChange?.d7 || 0,
              volume1h: response.volume?.h1 || 0,
              volume24h: response.volume?.h24 || 0,
              volume7d: response.volume?.d7 || 0,
              marketCap: response.marketCap || 0,
              holders: response.ownership?.holderCount || 0,
              whaleScore: calculateWhaleScore(response.ownership?.whaleCount || 0),
              metadata: {
                name: response.content?.metadata?.name || 'Unknown Token',
                symbol: response.content?.metadata?.symbol || 'Unknown',
                image: response.content?.files?.[0]?.uri || '',
                description: response.content?.metadata?.description || '',
                attributes: response.content?.metadata?.attributes || []
              }
            }));

          allTokens.push(...validTokens);
        }

        if (mounted) {
          setTokens(allTokens);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch tokens:', err);
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTokens();

    return () => {
      mounted = false;
    };
  }, [addresses]);

  return { tokens, isLoading, error };
} 