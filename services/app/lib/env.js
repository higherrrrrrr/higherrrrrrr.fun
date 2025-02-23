const requiredEnvVars = [
  'DATABASE_URL',
  'HELIUS_API_KEY',
  'NEXT_PUBLIC_RPC_URL',
  'NEXT_PUBLIC_NETWORK',
  'DUNE_API_KEY',
  'DUNE_QUERY_ID',
  'ZEROEX_API_KEY'
];

export function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
} 