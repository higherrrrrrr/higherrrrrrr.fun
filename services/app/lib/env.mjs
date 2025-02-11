import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const DEFAULT_WS_URL = 'ws://localhost:8080';
const DEFAULT_SOLANA_NETWORK = 'mainnet-beta';
const DEFAULT_HELIUS_RPC = 'https://api.mainnet-beta.solana.com';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    HELIUS_API_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_HELIUS_API_KEY: z.string().min(1),
    NEXT_PUBLIC_HELIUS_RPC_URL: z.string().url().default(DEFAULT_HELIUS_RPC),
    NEXT_PUBLIC_SOLANA_NETWORK: z.enum(['mainnet-beta', 'devnet', 'testnet']).default(DEFAULT_SOLANA_NETWORK),
    NEXT_PUBLIC_WS_URL: z.string().min(1).default(DEFAULT_WS_URL),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
    NEXT_PUBLIC_HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
    NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
});

// Export config object for convenience
export const config = {
  helius: {
    apiKey: env.NEXT_PUBLIC_HELIUS_API_KEY,
    rpcUrl: env.NEXT_PUBLIC_HELIUS_RPC_URL,
  },
  solana: {
    network: env.NEXT_PUBLIC_SOLANA_NETWORK,
  },
  ws: {
    url: env.NEXT_PUBLIC_WS_URL,
  }
};

export const validateEnv = () => env; 