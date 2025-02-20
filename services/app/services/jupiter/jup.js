import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import { Program, BN } from '@coral-xyz/anchor';
import fetch from 'cross-fetch';
import bs58 from 'bs58';
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
    try {
      const response = await fetch(
        `https://api.jup.ag/swap/v1/quote?inputMint=${inputMint.toBase58()}&outputMint=${outputMint.toBase58()}&amount=${amount.toString()}&slippageBps=${slippageBps}&platformFeeBps=100`
      );

      const quoteResponse = await response.json();
      console.log("🔹 Quote Response:", JSON.stringify(quoteResponse, null, 2));

      return quoteResponse;
    } catch (error) {
      throw new Error(`❌ Failed to fetch quote: ${error.message}`);
    }
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
      const quoteResponse = await this.getQuote({
        inputMint: new PublicKey(inputTokenAccount),  // ✅ Ensure it's the mint, not account
        outputMint: new PublicKey(outputTokenAccount),
        amount: minimumOutAmount,
        slippageBps: 50
      });
      
      

      const swapResponse = await fetch('https://api.jup.ag/swap/v1/swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteResponse,
          userPublicKey: this.wallet.publicKey.toBase58(),
          feeAccount: '9xJYno3be7R3aLoU6jDTLyPVwSvFDQPBUEU2G8c178nv', // ✅ Ensure this token account exists

        })
      }).then(res => res.json());

      console.log("✅ Swap Response:", JSON.stringify(swapResponse, null, 2));

      if (!swapResponse.swapTransaction) {
        console.error("❌ Swap failed: No transaction received from Jupiter API.");
        return null; // Prevents app from crashing
      }
      

      const transaction = Transaction.from(Buffer.from(swapResponse.swapTransaction, 'base64'));

     // Transaction must be signed by the customer, not backend
console.log("🚀 Ready to sign transaction on frontend");
      const signature = await this.connection.sendRawTransaction(transaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: "confirmed"
      });

      console.log("💰 Transaction Signature:", signature);
      return signature;
    } catch (error) {
      throw new Error(`❌ Swap failed: ${error.message}`);
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