import { PublicKey } from '@solana/web3.js';

export interface SplToken {
  address: string;
  mint: PublicKey;
  owner: PublicKey;
  amount: bigint;
  decimals: number;
}

export interface TokenMetadata {
  name: string;
  symbol: string;
  image?: string;
  description?: string;
  externalUrl?: string;
} 