const config = {
  // Core contract and API config
  CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x6F599293d4bB71750bbe7dD4D7D26780ad4c22E1",
  API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  
  // Token configuration
  BLACKLISTED_TOKENS: (process.env.NEXT_PUBLIC_BLACKLISTED_TOKENS || '').split(',').filter(Boolean),
  
  // Database configuration (if needed on frontend)
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/tokens_db',

  // Chain configuration
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL || 'https://mainnet.base.org',
};

export default config;