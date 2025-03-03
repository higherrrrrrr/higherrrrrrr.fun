import { recordJupiterTrade } from './tradeRecorder';

/**
 * Handles successful Jupiter swaps and records them
 * @param {Object} result - The Jupiter swap result
 */
export function handleJupiterSuccess(result) {
  console.log('🎉 Jupiter swap completed:', result);
  
  try {
    const signature = result.txid || result.signature;
    if (!signature) {
      console.warn('⚠️ No transaction signature found in Jupiter result');
      return;
    }
    
    // Try to get wallet address from multiple possible locations
    let walletAddress = null;
    
    // Check if wallet address is directly in result
    if (result.walletAddress || result.wallet?.publicKey) {
      walletAddress = (result.walletAddress || result.wallet?.publicKey)?.toString();
    }
    // Check if it's in the swap result
    else if (result.swapResult?.walletAddress) {
      walletAddress = result.swapResult.walletAddress.toString();
    }
    // Try to get from window.solana if available
    else if (typeof window !== 'undefined' && window.solana?.publicKey) {
      walletAddress = window.solana.publicKey.toString();
    }
    // Last resort - use unknown for now
    else {
      console.warn('⚠️ Using fallback method to determine wallet address');
      walletAddress = 'unknown-wallet';
    }
    
    // Extract token addresses
    let inputToken = null;
    let outputToken = null;
    
    // Try to get token addresses from several potential sources
    if (result.quoteResponseMeta?.quoteResponse) {
      inputToken = result.quoteResponseMeta.quoteResponse.inputMint;
      outputToken = result.quoteResponseMeta.quoteResponse.outputMint;
    }
    else if (result.swapResult) {
      inputToken = result.swapResult.inputMint || result.inputMint;
      outputToken = result.swapResult.outputMint || result.outputMint;
    }
    
    // Extract amounts
    const inputAmount = 
      result.quoteResponseMeta?.quoteResponse?.inputAmount ||
      result.quoteResponseMeta?.original?.inputAmount ||
      result.swapResult?.inputAmount ||
      result.inputAmount || 
      '0';
      
    const outputAmount = 
      result.quoteResponseMeta?.quoteResponse?.outputAmount ||
      result.quoteResponseMeta?.original?.outputAmount ||
      result.swapResult?.outputAmount ||
      result.outputAmount || 
      '0';
    
    // Construct trade details
    const tradeDetails = {
      transaction_hash: signature,
      wallet_address: walletAddress,
      token_in: inputToken,
      token_out: outputToken,
      amount_in: inputAmount.toString(),
      amount_out: outputAmount.toString(),
      block_timestamp: new Date().toISOString(),
      price_in_usd: '0',
      price_out_usd: '0'
      // Removing the fees field since it doesn't exist in the database
    };
    
    console.log('📊 Sending trade details to API:', tradeDetails);
    
    // Record the trade
    recordJupiterTrade(tradeDetails)
      .then(response => {
        console.log('Trade recording response:', response);
        if (!response.success) {
          console.error('Failed to record trade:', response.error);
        }
      })
      .catch(err => console.error('Failed to record trade:', err));
  } catch (error) {
    console.error('Error processing Jupiter result:', error);
  }
} 