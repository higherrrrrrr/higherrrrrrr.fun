/**
 * Helius API client for Solana data
 */
import { Helius } from 'helius-sdk';

export class HeliusClient {
  constructor() {
    // For client-side, we need to use the NEXT_PUBLIC_ prefix for environment variables
    this.apiKey = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    this.rpcUrl = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    
    console.log('Helius configuration check:');
    console.log('API Key available:', !!this.apiKey);
    console.log('RPC URL available:', !!this.rpcUrl);
    
    if (!this.rpcUrl) {
      console.warn('⚠️ Helius RPC URL is not configured. Price fetching will not work correctly.');
      // Provide a fallback if possible
      this.rpcUrl = 'https://mainnet.helius-rpc.com/?api-key=YOUR_FALLBACK_KEY';
    }
    
    // Initialize Helius SDK if we're in a Node.js environment
    if (typeof window === 'undefined' && this.apiKey) {
      this.heliusSdk = new Helius(this.apiKey);
    }
  }

  /**
   * Get parsed transaction details
   * @param {string} signature - Transaction signature
   * @returns {Promise<Object>} Parsed transaction
   */
  async getTransaction(signature) {
    try {
      const url = `${this.baseUrl}/transactions/${signature}?api-key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching transaction from Helius:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions for Jupiter program
   * @param {string} until - Signature to fetch transactions until
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} Transaction signatures
   */
  async getJupiterTransactions(until = null, limit = 20) {
    try {
      // Jupiter V6 program ID
      const jupiterProgramId = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
      
      const params = new URLSearchParams({
        'api-key': this.apiKey,
        limit: limit.toString(),
        commitment: 'confirmed',
        'program-id': jupiterProgramId
      });
      
      if (until) {
        params.append('until', until);
      }
      
      const url = `${this.baseUrl}/addresses/${jupiterProgramId}/transactions?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Helius API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Jupiter transactions from Helius:', error);
      throw error;
    }
  }

  /**
   * Get token prices from Helius using the SDK (replaces deprecated token-prices endpoint)
   * @param {Array<string>} tokenAddresses - Array of token mint addresses
   * @returns {Promise<Object>} Token prices keyed by mint address
   */
  async getTokenPrices(tokenAddresses) {
    console.log(`Fetching prices for ${tokenAddresses.length} tokens using Helius SDK`);
    
    // Initialize empty results object
    const prices = {};
    
    try {
      // Skip if no tokens to fetch
      if (!tokenAddresses || tokenAddresses.length === 0) {
        return prices;
      }
      
      // First try to use Helius RPC if available
      try {
        // This is the proper way to get prices with Helius API
        for (const tokenAddress of tokenAddresses) {
          try {
            // Use Helius RPC method to get token price
            const priceData = await this.rpcCall('tokenPrice', [tokenAddress]);
            
            if (priceData && priceData.price) {
              prices[tokenAddress] = priceData.price.toString();
              console.log(`Helius price for ${tokenAddress}: ${prices[tokenAddress]}`);
              continue;
            }
          } catch (error) {
            console.warn(`Helius price fetch failed for ${tokenAddress}, trying DexScreener fallback`);
            // Continue to fallback method
          }
          
          // Fallback to DexScreener API for this token
          try {
            const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
            
            if (response.ok) {
              const data = await response.json();
              if (data.pairs && data.pairs.length > 0) {
                // Get the first pair with price
                const pairWithPrice = data.pairs.find(pair => pair.priceUsd);
                if (pairWithPrice) {
                  prices[tokenAddress] = pairWithPrice.priceUsd;
                  console.log(`DexScreener price for ${tokenAddress}: ${prices[tokenAddress]}`);
                  continue;
                }
              }
            }
          } catch (dexError) {
            console.warn(`DexScreener API failed for ${tokenAddress}:`, dexError);
          }
          
          // If we get here, both methods failed, set price to 0
          console.warn(`No price found for ${tokenAddress}, setting to 0`);
          prices[tokenAddress] = '0';
        }
      } catch (apiError) {
        console.error('Error fetching from primary price API:', apiError);
        throw apiError; // Let the outer catch handle this
      }
      
      return prices;
    } catch (error) {
      console.error('Error in getTokenPrices:', error);
      
      // Return empty prices object on error
      return tokenAddresses.reduce((acc, addr) => {
        acc[addr] = '0';
        return acc;
      }, {});
    }
  }

  /**
   * Make RPC call to Helius
   * @param {string} method - RPC method name
   * @param {Array} params - RPC parameters
   * @returns {Promise<any>} RPC response
   */
  async rpcCall(method, params = []) {
    try {
      if (!this.rpcUrl) {
        throw new Error('Helius RPC URL not configured');
      }
      
      // Use fetch for browser environment, SDK for server environment
      if (typeof window !== 'undefined') {
        const response = await fetch(this.rpcUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: Date.now(),
            method,
            params,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
          throw new Error(`Helius RPC error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        
        return data.result;
      } else {
        // Server-side, use SDK
        if (!this.heliusSdk) {
          throw new Error('Helius SDK not initialized');
        }
        
        if (method === 'tokenPrice') {
          // Special case for tokenPrice - use getAsset and extract price
          const asset = await this.heliusSdk.rpc.getAsset({
            id: params[0]
          });
          
          if (asset?.token_info?.price_info?.price_per_token) {
            return { price: asset.token_info.price_info.price_per_token };
          }
          throw new Error('No price information available');
        }
        
        // Other methods can be called directly on the SDK
        return await this.heliusSdk.rpc[method](...params);
      }
    } catch (error) {
      console.error('Error making Helius RPC call:', error);
      throw error;
    }
  }

  /**
   * Get token metadata using Helius API
   * @param {string} tokenMint - Token mint address
   * @returns {Promise<Object|null>} Token metadata or null if not found
   */
  async getTokenMetadata(tokenMint) {
    try {
      // Use Helius RPC method to get asset details
      const assetData = await this.rpcCall('getAssetDetails', [tokenMint]);
      
      if (assetData) {
        // Extract relevant metadata
        return {
          address: tokenMint,
          name: assetData.name,
          symbol: assetData.symbol,
          decimals: assetData.decimals,
          logoURI: assetData.image,
          // Additional data as needed
        };
      }
    } catch (error) {
      console.warn(`Helius getAssetDetails failed for ${tokenMint}:`, error);
    }
    
    return null;
  }
}

// Export a singleton instance
export const heliusClient = new HeliusClient();

// Add a fallback to dexscreener
export async function getTokenPrice(tokenAddress) {
  try {
    // First try Helius
    const prices = await heliusClient.getTokenPrices([tokenAddress]);
    if (prices && prices[tokenAddress] && parseFloat(prices[tokenAddress]) > 0) {
      return prices[tokenAddress];
    }
    
    // If Helius fails or returns zero, fallback to dexscreener
    console.log(`Falling back to dexscreener for token: ${tokenAddress}`);
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`);
    const data = await response.json();
    
    if (data && data.pairs && data.pairs.length > 0) {
      return data.pairs[0].priceUsd;
    }
    
    return '0';
  } catch (error) {
    console.error('Error fetching token price:', error);
    return '0';
  }
} 