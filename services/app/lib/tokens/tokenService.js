import { query } from '@/models/db';
import { Helius } from 'helius-sdk';

// Common token defaults - ONLY used as fallbacks when API calls fail
const FALLBACK_TOKENS = {
  'So11111111111111111111111111111111111111112': { symbol: 'SOL', name: 'Solana', decimals: 9 },
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': { symbol: 'USDC', name: 'USD Coin', decimals: 6 },
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': { symbol: 'USDT', name: 'Tether USD', decimals: 6 },
};

let heliusClient = null;

// Initialize Helius client
function getHeliusClient() {
  if (heliusClient) return heliusClient;
  
  try {
    if (!process.env.HELIUS_API_KEY) {
      console.warn('HELIUS_API_KEY is not defined in environment variables');
      return null;
    }
    
    heliusClient = new Helius(process.env.HELIUS_API_KEY);
    return heliusClient;
  } catch (error) {
    console.error('Failed to initialize Helius client:', error);
    return null;
  }
}

/**
 * Get token metadata including decimals
 * First checks local DB cache, then fetches from Helius
 */
export async function getTokenMetadata(tokenAddress) {
  try {
    // Check cache first
    const cacheResult = await query(
      'SELECT * FROM token_metadata WHERE token_address = $1',
      [tokenAddress]
    );
    
    // If found in cache and not too old, return it
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (
      cacheResult.rows.length > 0 && 
      new Date() - new Date(cacheResult.rows[0].last_updated) < ONE_DAY
    ) {
      console.log(`Using cached metadata for token ${tokenAddress}`);
      return cacheResult.rows[0];
    }
    
    console.log(`Fetching fresh metadata for token ${tokenAddress}`);
    
    // Try to get token metadata from Helius
    const client = getHeliusClient();
    let tokenInfo = null;
    
    // First try the getAssetDetails method
    if (client) {
      try {
        console.log(`Trying getAssetDetails for ${tokenAddress}`);
        const asset = await client.rpc.getAssetDetails({
          id: tokenAddress,
          displayOptions: {
            showFungible: true
          }
        });
        
        if (asset) {
          console.log(`Found asset details for ${tokenAddress}:`, asset.name);
          tokenInfo = {
            token_address: tokenAddress,
            name: asset.content?.metadata?.name || asset.name || 'Unknown Token',
            symbol: asset.content?.metadata?.symbol || asset.symbol || tokenAddress.substring(0, 6),
            decimals: asset.content?.metadata?.decimals || asset.decimals || 9,
            logo_url: asset.content?.links?.image || asset.content?.metadata?.image || null
          };
        }
      } catch (error) {
        console.warn(`getAssetDetails failed for ${tokenAddress}:`, error.message);
      }
    }
    
    // If getAssetDetails failed, try tokenPrice as fallback (also provides metadata)
    if (!tokenInfo && client) {
      try {
        console.log(`Trying tokenPrice for ${tokenAddress}`);
        const priceData = await client.rpc.tokenPrice({
          mint: tokenAddress
        });
        
        if (priceData) {
          console.log(`Found token price data for ${tokenAddress}:`, priceData.name);
          tokenInfo = {
            token_address: tokenAddress,
            name: priceData.name || 'Unknown Token',
            symbol: priceData.symbol || tokenAddress.substring(0, 6),
            decimals: priceData.decimals || 9,
            logo_url: priceData.logoURI || null
          };
        }
      } catch (error) {
        console.warn(`tokenPrice failed for ${tokenAddress}:`, error.message);
      }
    }
    
    // If Helius methods failed, use direct RPC call
    if (!tokenInfo) {
      try {
        console.log(`Trying direct RPC call for ${tokenAddress}`);
        const response = await fetch(process.env.HELIUS_RPC_URL || 'https://mainnet.helius-rpc.com', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 'token-metadata',
            method: 'getAssetsByOwner',
            params: {
              ownerAddress: tokenAddress,
              limit: 1,
            },
          }),
        });
        
        const data = await response.json();
        const asset = data.result?.items?.[0];
        
        if (asset) {
          tokenInfo = {
            token_address: tokenAddress,
            name: asset.content?.metadata?.name || 'Unknown Token',
            symbol: asset.content?.metadata?.symbol || tokenAddress.substring(0, 6),
            decimals: asset.content?.metadata?.decimals || 9,
            logo_url: asset.content?.links?.image || asset.content?.metadata?.image || null
          };
        }
      } catch (error) {
        console.warn(`Direct RPC call failed for ${tokenAddress}:`, error.message);
      }
    }
    
    // If all API methods failed, use fallback data if available
    if (!tokenInfo && FALLBACK_TOKENS[tokenAddress]) {
      console.log(`Using fallback data for ${tokenAddress}`);
      tokenInfo = {
        token_address: tokenAddress,
        name: FALLBACK_TOKENS[tokenAddress].name || 'Unknown Token',
        symbol: FALLBACK_TOKENS[tokenAddress].symbol || tokenAddress.substring(0, 6),
        decimals: FALLBACK_TOKENS[tokenAddress].decimals || 9,
        logo_url: null
      };
    }
    
    // If nothing worked, create minimal info
    if (!tokenInfo) {
      console.log(`Creating minimal info for ${tokenAddress}`);
      tokenInfo = {
        token_address: tokenAddress,
        name: 'Unknown Token',
        symbol: tokenAddress.substring(0, 6) + '...',
        decimals: 9,
        logo_url: null
      };
    }
    
    // Cache the result
    await upsertTokenMetadata(tokenInfo);
    
    return tokenInfo;
  } catch (error) {
    console.error(`Error getting token metadata for ${tokenAddress}:`, error);
    
    // Even if error, try to return something useful
    return {
      token_address: tokenAddress,
      name: 'Unknown Token',
      symbol: tokenAddress.substring(0, 6) + '...',
      decimals: 9,
      logo_url: null
    };
  }
}

// Helper function to cache token metadata
async function upsertTokenMetadata(metadata) {
  try {
    await query(
      `INSERT INTO token_metadata 
       (token_address, name, symbol, decimals, logo_url, last_updated) 
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (token_address) DO UPDATE
       SET name = $2, symbol = $3, decimals = $4, logo_url = $5, last_updated = NOW()`,
      [
        metadata.token_address,
        metadata.name,
        metadata.symbol,
        metadata.decimals,
        metadata.logo_url
      ]
    );
  } catch (error) {
    console.error('Error upserting token metadata:', error);
  }
} 