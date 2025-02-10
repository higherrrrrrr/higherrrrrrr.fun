import { useEffect, useState } from 'react';
import { helius } from '@/lib/helius';
import { toast } from 'react-hot-toast';
import type { HeliusToken } from '@/lib/types';

const POPULAR_TOKEN_ADDRESSES = [
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
  // Add more token addresses as needed
];

export function useHeliusTokens() {
  const [tokens, setTokens] = useState<HeliusToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function fetchTokens() {
      try {
        // Fetch each token's data individually
        const tokenPromises = POPULAR_TOKEN_ADDRESSES.map(async (address) => {
          try {
            const response = await helius.rpc.getAsset({
              id: address,
              displayOptions: {
                showFungible: true,
              }
            });

            if (!response) return null;

            // Transform the response to match our HeliusToken type
            return {
              address: response.id,
              symbol: response.content?.metadata?.symbol || '',
              name: response.content?.metadata?.name || '',
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
                name: response.content?.metadata?.name || '',
                symbol: response.content?.metadata?.symbol || '',
                image: response.content?.files?.[0]?.uri || '',
                description: response.content?.metadata?.description || '',
                attributes: response.content?.metadata?.attributes || []
              }
            };
          } catch (err) {
            console.error(`Failed to fetch token ${address}:`, err);
            return null;
          }
        });

        const results = await Promise.all(tokenPromises);
        const validTokens = results.filter((token): token is HeliusToken => token !== null);

        if (mounted) {
          setTokens(validTokens);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch Helius tokens:', err);
        if (mounted) {
          setError(err as Error);
          setTokens([]);
          toast.error('Failed to fetch token data');
          // Retry after 5 seconds
          retryTimeout = setTimeout(fetchTokens, 5000);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    fetchTokens();
    const interval = setInterval(fetchTokens, 30000);

    return () => {
      mounted = false;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      clearInterval(interval);
    };
  }, []);

  return { tokens, isLoading, error };
}

function calculateWhaleScore(whaleCount: number): number {
  return Math.min(whaleCount * 10, 100); // 10 whales = 100% score
} 