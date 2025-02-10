import { Connection, PublicKey } from '@solana/web3.js';
import { env } from './env';

const FALLBACK_RPC = 'https://api.mainnet-beta.solana.com';
const RPC_URL = env.NEXT_PUBLIC_HELIUS_RPC_URL || FALLBACK_RPC;

// Add connection options for better reliability
export const connection = new Connection(RPC_URL, {
  commitment: 'confirmed',
  wsEndpoint: RPC_URL.startsWith('https') ? RPC_URL.replace('https', 'wss') : undefined,
  confirmTransactionInitialTimeout: 60000
});

export function isValidSolanaAddress(address: string): boolean {
  try {
    new PublicKey(address);
    return true;
  } catch {
    return false;
  }
} 