import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import { JUPITER_V6_PROGRAM_ID } from './constants';
import { IDL, Jupiter } from './idl/jupiter';

class JupiterInterface {
  constructor(connection, wallet) {
    this.connection = connection;
    this.wallet = wallet;
    this.program = new Program(IDL, JUPITER_V6_PROGRAM_ID, {
      connection,
      wallet
    });
  }

  /**
   * Get a quote for a token swap using on-chain data
   * @param {Object} params
   * @param {PublicKey} params.inputMint - Input token mint
   * @param {PublicKey} params.outputMint - Output token mint
   * @param {BN} params.amount - Amount of input tokens (in base units)
   * @param {number} params.slippageBps - Slippage tolerance in basis points
   */
  async getQuote({
    inputMint,
    outputMint,
    amount,
    slippageBps = 50
  }) {
    // Create route plan for direct swap
    const routePlan = [{
      inputMint,
      outputMint,
      inputAmount: new BN(amount),
      slippageBps: new BN(slippageBps),
      // You'll need to implement AMM selection logic here
      // This would involve checking liquidity across different AMMs
      ammProgram: null, // Selected AMM program ID
      ammKey: null // Selected AMM account key
    }];

    // Get token accounts
    const inputTokenAccount = await this.findAssociatedTokenAccount(inputMint);
    const outputTokenAccount = await this.findAssociatedTokenAccount(outputMint);

    // Calculate minimum output amount based on slippage
    const minimumOutAmount = this.calculateMinimumOutAmount(amount, slippageBps);

    return {
      routePlan,
      inputTokenAccount,
      outputTokenAccount,
      minimumOutAmount
    };
  }

  /**
   * Execute a swap transaction using the Jupiter program directly
   * @param {Object} params
   * @param {Array} params.routePlan - Array of route steps
   * @param {PublicKey} params.inputTokenAccount
   * @param {PublicKey} params.outputTokenAccount
   * @param {BN} params.minimumOutAmount
   */
  async swap({
    routePlan,
    inputTokenAccount,
    outputTokenAccount,
    minimumOutAmount
  }) {
    try {
      // Create route instruction
      const routeIx = await this.program.methods
        .route(
          routePlan,
          new BN(minimumOutAmount)
        )
        .accounts({
          tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
          userTransferAuthority: this.wallet.publicKey,
          userSourceTokenAccount: inputTokenAccount,
          userDestinationTokenAccount: outputTokenAccount,
          // Add other required accounts based on route
        })
        .instruction();

      // Create and send transaction
      const transaction = new Transaction().add(routeIx);
      
      // Sign and send transaction
      const signature = await this.program.provider.sendAndConfirm(transaction);

      return signature;

    } catch (error) {
      throw new Error(`Swap failed: ${error.message}`);
    }
  }

  /**
   * Find or create associated token account
   * @param {PublicKey} mint - Token mint address
   * @returns {Promise<PublicKey>} Token account address
   */
  async findAssociatedTokenAccount(mint) {
    // Implement ATA lookup/creation logic
    // You can use @solana/spl-token for this
    return null; // Return ATA public key
  }

  /**
   * Calculate minimum output amount based on slippage
   * @param {BN} amount 
   * @param {number} slippageBps
   * @returns {BN}
   */
  calculateMinimumOutAmount(amount, slippageBps) {
    const slippageMultiplier = new BN(10000 - slippageBps);
    return amount.mul(slippageMultiplier).div(new BN(10000));
  }

  /**
   * Get token accounts for the wallet
   * @returns {Promise<Array>}
   */
  async getTokenAccounts() {
    const accounts = await this.connection.getParsedTokenAccountsByOwner(
      this.wallet.publicKey,
      {
        programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')
      }
    );

    return accounts.value.map(account => ({
      mint: account.account.data.parsed.info.mint,
      address: account.pubkey.toString(),
      amount: account.account.data.parsed.info.tokenAmount.amount
    }));
  }
}

export default JupiterInterface; 