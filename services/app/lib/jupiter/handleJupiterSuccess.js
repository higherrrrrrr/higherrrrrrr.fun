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
    
    // Get wallet address from result
    const walletAddress = result.wallet?.publicKey?.toString();
    if (!walletAddress) {
      console.warn('⚠️ No wallet address found in Jupiter result');
      return;
    }
    
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
      transaction_hash: signature,
      wallet_address: walletAddress,
      token_in: finalInputToken,
      token_out: finalOutputToken,
      amount_in: inputAmount,
      amount_out: outputAmount,
      block_timestamp: new Date().toISOString()
    };
    
    console.log('📊 Sending trade details to API:', tradeDetails);
    
    // Mock or calculate fee (can be replaced with actual calculation later)
    const fee = inputAmount ? parseFloat(inputAmount) * 0.0035 : 0; // Assuming 0.35% fee
    
    // Mock USD prices (can be replaced with price API integration later)
    const priceInUsd = 1.0; // Mock price of input token in USD
    const priceOutUsd = 1.0; // Mock price of output token in USD
    
    // Record the trade
    fetch('/api/trades/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transaction_hash: signature,
        wallet_address: walletAddress,
        token_in: inputToken,
        token_out: outputToken,
        amount_in: inputAmount,
        amount_out: outputAmount,
        block_timestamp: new Date().toISOString(),
        fees: fee.toString(),
        price_in_usd: priceInUsd.toString(),
        price_out_usd: priceOutUsd.toString()
      }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          console.log('✅ Trade recorded:', data.trade_id);
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