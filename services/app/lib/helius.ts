import { Connection, PublicKey } from '@solana/web3.js';
import { Helius } from 'helius-sdk';
import { metaplex } from './metaplex';
import { toast } from 'react-hot-toast';
import { clientEnv } from './env.client';

const rpcUrl = clientEnv.NEXT_PUBLIC_HELIUS_RPC_URL;
if (!rpcUrl) {
  throw new Error('NEXT_PUBLIC_HELIUS_RPC_URL is not configured');
}

// Parse RPC URL for both HTTP and WebSocket endpoints
const parseRpcUrl = (url: string) => {
  const isHelius = url.includes('helius');
  
  if (isHelius) {
    const apiKey = url.split('api-key=')[1];
    return {
      http: `https://rpc.helius.xyz/?api-key=${apiKey}`,
      ws: `wss://rpc.helius.xyz/?api-key=${apiKey}`
    };
  }
  
  const baseUrl = url.split('?')[0];
  return {
    http: baseUrl,
    ws: baseUrl.replace('https://', 'wss://')
  };
};

const endpoints = parseRpcUrl(rpcUrl);

export const heliusRpcUrl = endpoints.http;
export const heliusWsUrl = endpoints.ws;

// Create the Helius client with mainnet cluster
export const helius = new Helius(env.HELIUS_API_KEY, {
  rpcUrl: clientEnv.NEXT_PUBLIC_HELIUS_RPC_URL,
  timeout: 30000,
  retry: {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 5000
  }
});

// Retry logic for Helius API calls
async function retryHelius<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries > 0) {
      console.warn('Retrying Helius API call...', { retriesLeft: retries });
      await new Promise(resolve => setTimeout(resolve, 1000));
      return retryHelius(fn, retries - 1);
    }
    toast.error('Failed to fetch token data. Please try again.');
    throw error;
  }
}

const calculateWhaleScore = (whaleCount: number): number => {
  if (whaleCount >= 100) return 5;
  if (whaleCount >= 50) return 4;
  if (whaleCount >= 20) return 3;
  if (whaleCount >= 10) return 2;
  if (whaleCount >= 1) return 1;
  return 0;
};

export async function getHeliusTokenData(addresses?: string[]) {
  return retryHelius(async () => {
    try {
      let tokens;
      
      if (addresses && addresses.length > 0) {
        const responses = await Promise.all(
          addresses.map(address =>
            helius.rpc.getAsset({
              id: address,
              displayOptions: { showFungible: true }
            }).catch(err => {
              console.error(`Failed to fetch token ${address}:`, err);
              return null;
            })
          )
        );
        tokens = responses.filter(r => r !== null);
      } else {
        const response = await helius.rpc.getAssetsByGroup({
          groupKey: 'collection',
          groupValue: 'All Tokens',
          page: 1,
          limit: 100,
        });
        tokens = response.items;
      }

      return tokens.map(token => ({
        address: token.id,
        symbol: token.content?.metadata?.symbol || 'Unknown',
        name: token.content?.metadata?.name || 'Unknown Token',
        price: token.price || 0,
        priceChange1h: token.priceChange?.h1 || 0,
        priceChange24h: token.priceChange?.h24 || 0,
        priceChange7d: token.priceChange?.d7 || 0,
        volume1h: token.volume?.h1 || 0,
        volume24h: token.volume?.h24 || 0,
        volume7d: token.volume?.d7 || 0,
        marketCap: token.marketCap || 0,
        holders: token.ownership?.holderCount || 0,
        whaleScore: calculateWhaleScore(token.ownership?.whaleCount || 0),
        metadata: {
          name: token.content?.metadata?.name || 'Unknown Token',
          symbol: token.content?.metadata?.symbol || 'Unknown',
          image: token.content?.files?.[0]?.uri || '',
          description: token.content?.metadata?.description || '',
          attributes: token.content?.metadata?.attributes || []
        }
      }));
    } catch (error) {
      console.error('Failed to fetch token data:', error);
      throw error;
    }
  });
}

export async function getTokenMetadata(address: string) {
  try {
    const response = await helius.rpc.getAsset({ id: address });
    return response;
  } catch (error) {
    console.error('Failed to fetch token metadata:', error);
    return null;
  }
}

export async function getWalletTransactions(address: string | undefined) {
  if (!address) return [];
  
  try {
    // Use the parsed transaction history endpoint
    const response = await fetch(`https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${env.HELIUS_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch wallet transactions:', error);
    return [];
  }
}

export async function getWalletTokens(address: string | undefined) {
  if (!address) return [];
  
  try {
    const response = await helius.rpc.getAssetsByOwner({
      ownerAddress: address,
      page: 1,
      limit: 1000,
    });
    
    return response?.items || [];
  } catch (error) {
    console.error('Failed to fetch wallet tokens:', error);
    return [];
  }
} 