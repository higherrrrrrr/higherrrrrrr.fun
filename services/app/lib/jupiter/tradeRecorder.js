/**
 * Utility for detecting and recording Jupiter trades
 */

import { heliusClient } from '../helius/client';
import { getTokenDecimals } from '../tokens/tokenRegistry';

// In-memory cache for token decimals to avoid repeated fetches
const tokenDecimalsCache = new Map();

/**
 * Get token decimals with caching
 * @param {string|Object} tokenMint - Token mint address (string or PublicKey)
 * @returns {Promise<number>} Token decimals
 */
async function getAndCacheTokenDecimals(tokenMint) {
  // Convert to string if it's an object
  const tokenAddress = typeof tokenMint === 'string' ? tokenMint : tokenMint.toString();
  
  // Return from cache if available
  if (tokenDecimalsCache.has(tokenAddress)) {
    return tokenDecimalsCache.get(tokenAddress);
  }
  
  try {
    // Fetch from Jupiter token list
    const decimals = await getTokenDecimals(tokenAddress);
    tokenDecimalsCache.set(tokenAddress, decimals);
    return decimals;
  } catch (error) {
    console.warn(`Failed to get decimals for ${tokenAddress}, using default:`, error);
    // Default to 9 decimals (most common for Solana)
    tokenDecimalsCache.set(tokenAddress, 9);
    return 9;
  }
}

/**
 * Record a Jupiter trade
 * @param {Object} tradeData - Trade data
 * @returns {Promise<Object>} API response
 */
export async function recordJupiterTrade(tradeData) {
  console.log('Recording trade with data:', tradeData);
  
  // Ensure token addresses are strings
  if (tradeData.token_in && typeof tradeData.token_in !== 'string') {
    tradeData.token_in = tradeData.token_in.toString();
  }
  
  if (tradeData.token_out && typeof tradeData.token_out !== 'string') {
    tradeData.token_out = tradeData.token_out.toString();
  }
  
  try {
    // Fetch price data if needed
    if (!tradeData.price_in_usd || !tradeData.price_out_usd || 
        tradeData.price_in_usd === '0' || tradeData.price_out_usd === '0') {
      try {
        const priceData = await heliusClient.getTokenPrices([
          tradeData.token_in,
          tradeData.token_out
        ]);
        
        // Ensure prices are strings
        tradeData.price_in_usd = priceData[tradeData.token_in] || '0';
        tradeData.price_out_usd = priceData[tradeData.token_out] || '0';
      } catch (priceError) {
        console.warn('Unable to fetch token prices:', priceError);
        // Price fetch failed, retain existing values or set to 0
        tradeData.price_in_usd = tradeData.price_in_usd || '0';
        tradeData.price_out_usd = tradeData.price_out_usd || '0';
      }
    }
    
    // Get token decimals
    const decimalIn = await getAndCacheTokenDecimals(tradeData.token_in);
    const decimalOut = await getAndCacheTokenDecimals(tradeData.token_out);
    
    console.log(`Token decimals: ${tradeData.token_in}=${decimalIn}, ${tradeData.token_out}=${decimalOut}`);
    
    // Calculate USD values
    const amountIn = parseFloat(tradeData.amount_in);
    const priceIn = parseFloat(tradeData.price_in_usd);
    const divisorIn = Math.pow(10, decimalIn);
    const valueInUsd = (amountIn / divisorIn) * priceIn;
    
    const amountOut = parseFloat(tradeData.amount_out);
    const priceOut = parseFloat(tradeData.price_out_usd);
    const divisorOut = Math.pow(10, decimalOut);
    const valueOutUsd = (amountOut / divisorOut) * priceOut;
    
    // Update the trade data
    tradeData.value_in_usd = valueInUsd.toString();
    tradeData.value_out_usd = valueOutUsd.toString();
    
    // Log calculation details for debugging
    console.log('USD value calculation:', {
      in: {
        token: tradeData.token_in,
        amount: amountIn,
        decimals: decimalIn,
        divisor: divisorIn,
        price: priceIn,
        value: valueInUsd
      },
      out: {
        token: tradeData.token_out,
        amount: amountOut,
        decimals: decimalOut,
        divisor: divisorOut,
        price: priceOut,
        value: valueOutUsd
      }
    });
    
    // Make the API call to record the trade
    const response = await fetch('/api/trades/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tradeData),
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error recording Jupiter trade:', error);
    throw error;
  }
}

// Integration with Jupiter swap function
export function attachTradeRecorder(jupiterInstance) {
  // Store the original swap function
  const originalSwap = jupiterInstance.swap;
  
  // Override the swap function to include trade recording
  jupiterInstance.swap = async function(...args) {
    try {
      // Call the original swap function
      const signature = await originalSwap.apply(this, args);
      
      // Extract trade details from args and result
      const tradeDetails = {
        transaction_hash: signature,
        wallet_address: this.wallet.publicKey.toString(),
        token_in: args[0]?.inputMint?.toString(),
        token_out: args[0]?.outputMint?.toString(),
        amount_in: args[0]?.inputAmount?.toString(),
        amount_out: args[0]?.minimumOutAmount?.toString(),
        block_timestamp: new Date().toISOString()
      };
      
      // Get token prices from Helius for more accurate pricing
      if (tradeDetails.token_in && tradeDetails.token_out) {
        try {
          const prices = await heliusClient.getTokenPrices([
            tradeDetails.token_in,
            tradeDetails.token_out
          ]);
          
          // Ensure prices are strings
          tradeDetails.price_in_usd = prices[tradeDetails.token_in] ? 
            String(prices[tradeDetails.token_in]) : '0';
          tradeDetails.price_out_usd = prices[tradeDetails.token_out] ? 
            String(prices[tradeDetails.token_out]) : '0';
          
          console.log('Fetched prices:', {
            token_in: tradeDetails.token_in,
            price_in: tradeDetails.price_in_usd,
            token_out: tradeDetails.token_out,
            price_out: tradeDetails.price_out_usd
          });
        } catch (priceError) {
          console.warn('Unable to fetch token prices:', priceError);
          tradeDetails.price_in_usd = '0';
          tradeDetails.price_out_usd = '0';
        }
      }
      
      // Add debug logging before making the API call
      console.log('Trade details for recording:', {
        transaction_hash: tradeDetails.transaction_hash,
        wallet_address: tradeDetails.wallet_address,
        token_in: tradeDetails.token_in,
        token_out: tradeDetails.token_out,
        amount_in: tradeDetails.amount_in,
        amount_out: tradeDetails.amount_out,
        price_in_usd: tradeDetails.price_in_usd,
        price_out_usd: tradeDetails.price_out_usd
      });
      
      // Record the trade asynchronously (don't await)
      recordJupiterTrade(tradeDetails)
        .then(result => {
          console.log('Trade recorded successfully:', result);
        })
        .catch(error => {
          console.error('Failed to record trade:', error);
        });
      
      return signature;
    } catch (error) {
      console.error('Error in swap function:', error);
      throw error;
    }
  };
  
  return jupiterInstance;
} 