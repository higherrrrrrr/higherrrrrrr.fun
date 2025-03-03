/**
 * Utility for detecting and recording Jupiter trades
 */

// Function to record a Jupiter trade
export async function recordJupiterTrade(tradeDetails) {
  try {
    const response = await fetch('/api/trades/record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tradeDetails),
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Jupiter trade recorded successfully', data);
      return data;
    } else {
      console.error('❌ Failed to record Jupiter trade:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error sending Jupiter trade data:', error);
    return null;
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
        token_in: args[0]?.inputTokenAccount?.toString(),
        token_out: args[0]?.outputTokenAccount?.toString(),
        amount_in: args[0]?.inputAmount?.toString(),
        amount_out: args[0]?.minimumOutAmount?.toString(),
        block_timestamp: new Date().toISOString(),
        // Mock values for now - to be replaced with actual calculations
        fees: (parseFloat(args[0]?.inputAmount || 0) * 0.0035).toString(), // Assuming 0.35% fee
        price_in_usd: 1.0, // Default mock value
        price_out_usd: 1.0  // Default mock value
      };
      
      // Record the trade asynchronously (don't await)
      recordJupiterTrade(tradeDetails)
        .catch(err => console.error('Failed to record trade:', err));
      
      return signature;
    } catch (error) {
      // Pass through the original error
      throw error;
    }
  };
  
  return jupiterInstance;
} 