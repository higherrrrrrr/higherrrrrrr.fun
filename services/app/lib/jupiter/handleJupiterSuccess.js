import { recordJupiterTrade } from './tradeRecorder';

/**
 * Handles successful Jupiter swaps and records them
 * @param {Object} result - The Jupiter swap result
 */
export function handleJupiterSuccess(result) {
  console.log('🎉 Jupiter swap completed:', result);
  
  try {
    // First, let's examine the result structure more carefully
    console.log('Jupiter result structure:', {
      txid: result.txid,
      walletAddress: result.walletAddress || result.wallet,
      swapResult: result.swapResult || {},
      quoteResponseMeta: result.quoteResponseMeta || {}
    });
    
    // Extract token mints from deep within the response structure
    const inputToken = 
      // Look for mint in quoteResponseMeta paths
      result.quoteResponseMeta?.quoteResponse?.inputMint ||
      result.quoteResponseMeta?.original?.inputMint ||
      // Or try to get it from SwapResult
      result.swapResult?.inputMint ||
      // Or from top level
      result.inputMint;
      
    const outputToken = 
      // Look for mint in quoteResponseMeta paths
      result.quoteResponseMeta?.quoteResponse?.outputMint ||
      result.quoteResponseMeta?.original?.outputMint || 
      // Or try to get it from SwapResult
      result.swapResult?.outputMint ||
      // Or from top level
      result.outputMint;
      
    // Look for wallet address in various locations
    const walletAddress = 
      result.walletAddress || 
      result.wallet ||
      result.swapResult?.userPublicKey ||
      result.swapResult?.user?.toString() ||
      // Try to get from Jupiter global object
      (typeof window !== 'undefined' && window.Jupiter?.user?.publicKey?.toString()) ||
      // Try to get from Phantom wallet if connected
      (typeof window !== 'undefined' && window.solana?.publicKey?.toString()) ||
      'unknown';
    
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
    
    // Extract addresses from SwapResult
    const finalInputToken = inputToken || result.swapResult?.inputAddress?.toString();
    const finalOutputToken = outputToken || result.swapResult?.outputAddress?.toString();
    
    // Build trade details object with fallbacks
    const tradeDetails = {
      transaction_hash: result.txid,
      wallet_address: walletAddress,
      token_in: finalInputToken,
      token_out: finalOutputToken,
      amount_in: inputAmount,
      amount_out: outputAmount,
      block_timestamp: new Date().toISOString()
    };
    
    console.log('📊 Sending trade details to API:', tradeDetails);
    
    // Record the trade (don't wait for the result)
    recordJupiterTrade(tradeDetails)
      .then((data) => {
        if (data?.success) {
          console.log('✅ Trade recorded successfully:', data.trade_id);
        } else {
          console.warn('⚠️ Trade recording response issue:', data);
        }
      })
      .catch(error => {
        console.error('❌ Error recording trade:', error);
      });
      
  } catch (error) {
    console.error('❌ Error processing Jupiter success:', error);
  }
} 