import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex } from '@metaplex-foundation/js';
import { env } from '@/lib/env.mjs';

const connection = new Connection(env.NEXT_PUBLIC_HELIUS_RPC_URL, {
  commitment: 'confirmed',
  wsEndpoint: env.NEXT_PUBLIC_HELIUS_RPC_URL.includes('helius') 
    ? env.NEXT_PUBLIC_HELIUS_RPC_URL.replace('https', 'wss') 
    : undefined,
});

export const metaplex = new Metaplex(connection);

export async function getMetadata(mintAddress: string) {
  try {
    const mint = new PublicKey(mintAddress);
    const nft = await metaplex.nfts().findByMint({ mintAddress: mint });
    return nft;
  } catch (error) {
    console.error('Failed to fetch NFT metadata:', error);
    return null;
  }
} 