const config = {
  // Core contract and API config
  CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1",
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  
  // Token configuration
  BLACKLISTED_TOKENS: [],
  
  // Database configuration (if needed on frontend)
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/tokens_db',

  // Chain configuration
  RPC_URL: process.env.RPC_URL,
  
  // Dune Analytics configuration
  DUNE_API_KEY: process.env.DUNE_API_KEY,
  DUNE_QUERY_ID: process.env.NEXT_PUBLIC_DUNE_QUERY_ID || '4709938', // Hardcoded fallback
  DUNE_REFRESH_INTERVAL: 60000, // 1 minute
};

// Add validation
if (!config.DUNE_API_KEY) {
  console.error('DUNE_API_KEY is not configured');
}

if (!config.DUNE_QUERY_ID) {
  console.error('DUNE_QUERY_ID is not configured');
}

export default config;