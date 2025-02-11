import * as dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env.local file
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const DEFAULT_RPC = 'https://api.mainnet-beta.solana.com';

// Define environment schema
const envSchema = z.object({
  DATABASE_URL: z.string(),
  HELIUS_API_KEY: z.string(),
  NEXT_PUBLIC_HELIUS_API_KEY: z.string(),
  NEXT_PUBLIC_HELIUS_RPC_URL: z.string().default(DEFAULT_RPC),
  NEXT_PUBLIC_WS_URL: z.string().default('ws://localhost:8080'),
});

// Parse and export environment variables
export const env = envSchema.parse(process.env);

// Log loaded environment for debugging
console.log('Loaded environment variables:', {
  hasHeliusKey: !!env.HELIUS_API_KEY,
  hasRpcUrl: !!env.NEXT_PUBLIC_HELIUS_RPC_URL,
  wsUrl: env.NEXT_PUBLIC_WS_URL
}); 