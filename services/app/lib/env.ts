import { z } from 'zod';

// Define default values
const DEFAULT_WS_URL = 'ws://localhost:8080';
const DEFAULT_SOLANA_NETWORK = 'mainnet-beta';
const DEFAULT_HELIUS_RPC = 'https://api.mainnet-beta.solana.com';

const envSchema = z.object({
  // Required for Helius API
  NEXT_PUBLIC_HELIUS_API_KEY: z.string().min(1),
  
  // Optional with defaults
  NEXT_PUBLIC_HELIUS_RPC_URL: z.string().url().optional().default(DEFAULT_HELIUS_RPC),
  NEXT_PUBLIC_SOLANA_NETWORK: z.enum(['mainnet-beta', 'devnet', 'testnet']).default(DEFAULT_SOLANA_NETWORK),
  NEXT_PUBLIC_WS_URL: z.string().min(1).default(DEFAULT_WS_URL),
  
  // Optional database configs - only required in production
  UPSTASH_REDIS_URL: z.string().url().optional(),
  UPSTASH_REDIS_TOKEN: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
});

// Separate schema for production
const productionEnvSchema = envSchema.extend({
  UPSTASH_REDIS_URL: z.string().url(),
  UPSTASH_REDIS_TOKEN: z.string().min(1),
  DATABASE_URL: z.string().url(),
});

export const env = envSchema.parse({
  NEXT_PUBLIC_HELIUS_API_KEY: process.env.NEXT_PUBLIC_HELIUS_API_KEY,
  NEXT_PUBLIC_HELIUS_RPC_URL: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
  NEXT_PUBLIC_SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK,
  NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  UPSTASH_REDIS_URL: process.env.UPSTASH_REDIS_URL,
  UPSTASH_REDIS_TOKEN: process.env.UPSTASH_REDIS_TOKEN,
  DATABASE_URL: process.env.DATABASE_URL
});

export function validateEnv() {
  try {
    if (process.env.NODE_ENV === 'production') {
      productionEnvSchema.parse(process.env);
    } else {
      envSchema.parse(process.env);
    }
  } catch (error) {
    console.error('Invalid environment variables:', error);
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Invalid environment configuration');
    } else {
      console.warn('Running with default development configuration');
    }
  }
}

// Export typed environment variables
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
  },
  database: {
    redis: env.UPSTASH_REDIS_URL ? {
      url: env.UPSTASH_REDIS_URL,
      token: env.UPSTASH_REDIS_TOKEN,
    } : undefined,
    postgres: env.DATABASE_URL,
  },
}; 