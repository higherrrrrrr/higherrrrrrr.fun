import { recordJupiterTrade } from './tradeRecorder';
import { heliusClient } from '../helius/client';

/**
 * Service for indexing and processing Jupiter swap transactions using Helius
 */
export class JupiterIndexer {
  constructor(pollInterval = 30000) {
    this.pollInterval = pollInterval;
    this.isRunning = false;
    this.timerId = null;
    this.lastSignature = null;
    this.processingQueue = [];
  }

  /**
   * Start the indexer service
   */
  start() {
    if (this.isRunning) return;
    
    console.log('🚀 Starting Jupiter transaction indexer service');
    this.isRunning = true;
    this.poll();
  }

  /**
   * Stop the indexer service
   */
  stop() {
    if (!this.isRunning) return;
    
    console.log('🛑 Stopping Jupiter transaction indexer service');
    this.isRunning = false;
    
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Poll for new Jupiter transactions
   */
  async poll() {
    if (!this.isRunning) return;
    
    try {
      // Fetch Jupiter transactions from Helius
      const transactions = await heliusClient.getJupiterTransactions(this.lastSignature);
      
      if (transactions && transactions.length > 0) {
        console.log(`📊 Found ${transactions.length} Jupiter transactions`);
        
        // Update the last signature to use for pagination in the next poll
        this.lastSignature = transactions[0].signature;
        
        // Add transactions to processing queue
        this.processingQueue = this.processingQueue.concat(transactions);
        
        // Start processing the queue if not already processing
        this.processQueue();
      }
    } catch (error) {
      console.error('Error polling for transactions:', error);
    }
    
    // Schedule the next poll
    if (this.isRunning) {
      this.timerId = setTimeout(() => this.poll(), this.pollInterval);
    }
  }

  /**
   * Process transactions in the queue
   */
  async processQueue() {
    if (this.processingQueue.length === 0) return;
    
    // Get next transaction from queue
    const transaction = this.processingQueue.shift();
    
    try {
      // Get full transaction details from Helius
      const txDetails = await heliusClient.getTransaction(transaction.signature);
      
      if (!txDetails) {
        console.warn(`Transaction details not found for ${transaction.signature}`);
        if (this.processingQueue.length > 0) {
          this.processQueue();
        }
        return;
      }
      
      // Extract swap details
      const swapDetails = this.extractJupiterSwapDetails(txDetails, transaction.signature);
      
      if (swapDetails) {
        // Get token prices from Helius
        const prices = await heliusClient.getTokenPrices([
          swapDetails.token_in,
          swapDetails.token_out
        ]);
        
        // Add price data
        swapDetails.price_in_usd = prices[swapDetails.token_in] ? String(prices[swapDetails.token_in]) : '0';
        swapDetails.price_out_usd = prices[swapDetails.token_out] ? String(prices[swapDetails.token_out]) : '0';
        
        // Record the trade
        await recordJupiterTrade(swapDetails);
        console.log(`✅ Recorded Jupiter swap: ${transaction.signature}`);
      }
    } catch (error) {
      console.error(`❌ Error processing transaction ${transaction.signature}:`, error);
    }
    
    // Continue processing queue
    if (this.processingQueue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * Extract Jupiter swap details from a transaction
   * @param {Object} txDetails - Transaction details from Helius
   * @param {string} signature - Transaction signature
   * @returns {Object|null} Swap details or null if not a swap
   */
  extractJupiterSwapDetails(txDetails, signature) {
    try {
      if (!txDetails || !txDetails.instructions) {
        return null;
      }
      
      // Check if this is a Jupiter swap by looking for Jupiter program in instructions
      const jupiterInstructions = txDetails.instructions.filter(
        ix => ix.programId === 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'
      );
      
      if (jupiterInstructions.length === 0) {
        return null;
      }
      
      // Get wallet address (transaction signer)
      const walletAddress = txDetails.feePayer;
      
      // Look for token balances changes to identify swap tokens
      const tokenBalances = txDetails.tokenTransfers || [];
      
      if (tokenBalances.length < 2) {
        return null;
      }
      
      // Find input token (negative amount)
      const inputTokenInfo = tokenBalances.find(transfer => 
        transfer.fromUserAccount === walletAddress && 
        parseFloat(transfer.tokenAmount) < 0
      );
      
      // Find output token (positive amount)
      const outputTokenInfo = tokenBalances.find(transfer => 
        transfer.toUserAccount === walletAddress && 
        parseFloat(transfer.tokenAmount) > 0
      );
      
      if (!inputTokenInfo || !outputTokenInfo) {
        return null;
      }
      
      // Calculate fee (simplified - in real implementation, extract from logs)
      const inputAmount = Math.abs(parseFloat(inputTokenInfo.tokenAmount));
      const estimatedFee = inputAmount * 0.0035; // 0.35%
      
      return {
        transaction_hash: signature,
        wallet_address: walletAddress,
        token_in: inputTokenInfo.mint,
        token_out: outputTokenInfo.mint,
        amount_in: inputAmount.toString(),
        amount_out: outputTokenInfo.tokenAmount,
        block_timestamp: new Date(txDetails.timestamp * 1000).toISOString(),
        price_in_usd: '0', // Will be filled by Helius
        price_out_usd: '0',  // Will be filled by Helius
        value_in_usd: '0',
        value_out_usd: '0'
      };
    } catch (error) {
      console.error('Error extracting swap details:', error);
      return null;
    }
  }
}

// Export singleton instance
export const jupiterIndexer = new JupiterIndexer(); 