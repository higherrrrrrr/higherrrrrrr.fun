/**
 * Token registry that provides information about SPL tokens
 * Uses Jupiter's token list for maximum token coverage
 */

// Cache for token list
let jupiterTokenListCache = null;
let lastFetchTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Common token decimals as fallback (most critical tokens)
const COMMON_TOKEN_DECIMALS = {
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 6,   // USDC
  'So11111111111111111111111111111111111111112': 9,    // SOL (Wrapped)
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 6,   // USDT
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 9,    // mSOL
  '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj': 9,   // stSOL
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 5,   // BONK
};

/**
 * Fetch Jupiter token list
 * @returns {Promise<Array>} Array of token metadata objects
 */
export async function fetchJupiterTokenList() {
  const now = Date.now();
  
  // Use cached data if available and fresh
  if (jupiterTokenListCache && (now - lastFetchTime < CACHE_TTL)) {
    return jupiterTokenListCache;
  }
  
  try {
    // Fetch Jupiter token list (including unverified tokens)
    const response = await fetch('https://token.jup.ag/all');
    if (!response.ok) {
      throw new Error(`Failed to fetch Jupiter token list: ${response.status}`);
    }
    
    const tokenList = await response.json();
    
    // Cache the response
    jupiterTokenListCache = tokenList;
    lastFetchTime = now;
    
    console.log(`Fetched ${tokenList.length} tokens from Jupiter token list`);
    return tokenList;
  } catch (error) {
    console.error('Error fetching Jupiter token list:', error);
    // Return cached list if available, even if expired
    return jupiterTokenListCache || [];
  }
}

/**
 * Get token metadata from Jupiter token list
 * @param {string} tokenMint - Token mint address
 * @returns {Promise<Object|null>} Token metadata or null if not found
 */
export async function getTokenMetadata(tokenMint) {
  if (!tokenMint) return null;
  
  // If token address is an object (like PublicKey), convert to string
  if (typeof tokenMint !== 'string') {
    tokenMint = tokenMint.toString();
  }
  
  const tokenList = await fetchJupiterTokenList();
  return tokenList.find(token => token.address === tokenMint) || null;
}

/**
 * Get token decimals from Jupiter token list with fallback
 * @param {string|Object} tokenMint - Token mint address (string or PublicKey)
 * @returns {Promise<number>} Token decimals
 */
export async function getTokenDecimals(tokenMint) {
  // If token address is an object (like PublicKey), convert to string
  const tokenAddress = typeof tokenMint === 'string' ? tokenMint : tokenMint.toString();
  
  // Check common tokens first (fastest path)
  if (COMMON_TOKEN_DECIMALS[tokenAddress]) {
    return COMMON_TOKEN_DECIMALS[tokenAddress];
  }
  
  // Try to get from Jupiter token list
  const metadata = await getTokenMetadata(tokenAddress);
  if (metadata?.decimals !== undefined) {
    return metadata.decimals;
  }
  
  // Default to 9 decimals if everything fails
  return 9;
} 