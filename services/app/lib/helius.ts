import { Helius } from 'helius-sdk';
import { Metaplex } from '@metaplex-foundation/js';
import { connection } from './solana';
import { PublicKey } from '@solana/web3.js';
import { toast } from 'react-hot-toast';
import { env } from './env';

if (!env.NEXT_PUBLIC_HELIUS_API_KEY) {
  throw new Error('HELIUS_API_KEY is required');
}

// Create the Helius client with mainnet cluster
export const helius = new Helius({
  apiKey: env.NEXT_PUBLIC_HELIUS_API_KEY || '',
});

const metaplex = new Metaplex(connection);

// Add retry logic for Helius calls
async function retryHelius<T>(
  operation: () => Promise<T>,
  retries = 3
): Promise<T | null> {
  for (let i = 0; i < retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries - 1) {
        console.error('Helius operation failed after retries:', error);
        toast.error('Failed to fetch token data');
        return null;
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  return null;
}

export async function getHeliusTokenData() {
  return retryHelius(async () => {
    const response = await helius.rpc.getAssetsByGroup({
      groupKey: 'collection',
      groupValue: 'All Tokens',
      page: 1,
      limit: 100,
    });

    // Get Metaplex data for each token
    const tokensWithMetadata = await Promise.all(
      response.items.map(async token => {
        try {
          const metadata = await metaplex.nfts().findByMint({ 
            mintAddress: new PublicKey(token.id) 
          });

          return {
            ...token,
            metaplexData: {
              name: metadata.name,
              symbol: metadata.symbol,
              image: metadata.json?.image,
              description: metadata.json?.description,
              attributes: metadata.json?.attributes
            }
          };
        } catch (err) {
          console.error(`Failed to get Metaplex data for token ${token.id}:`, err);
          return token;
        }
      })
    );

    return tokensWithMetadata.map(token => ({
      address: token.id,
      symbol: token.symbol,
      name: token.name,
      price: token.price,
      priceChange1h: token.priceChange.h1,
      priceChange24h: token.priceChange.h24,
      priceChange7d: token.priceChange.d7,
      volume1h: token.volume.h1,
      volume24h: token.volume.h24,
      volume7d: token.volume.d7,
      marketCap: token.marketCap,
      holders: token.holders,
      whaleScore: calculateWhaleScore(token.holderDistribution),
      metadata: token.metaplexData
    }));
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
    const response = await fetch(`https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${env.NEXT_PUBLIC_HELIUS_API_KEY}`);
    
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

function calculateWhaleScore(distribution: any) {
  // Calculate what % of supply is held by top 10 wallets
  // Higher score means more whale concentration
  return Math.min(
    (distribution?.top10Holders?.percentage || 0) * 100,
    100
  );
} 