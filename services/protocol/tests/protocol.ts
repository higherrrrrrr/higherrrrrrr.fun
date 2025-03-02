import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Protocol } from "../target/types/protocol";
import { assert } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

describe("protocol", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Protocol as Program<Protocol>;
  const wallet = provider.wallet as anchor.Wallet;

  // Test accounts
  const tokenCreator = wallet;
  let tokenAMint: Keypair;
  let tokenBMint: Keypair; // Usually SOL/WSOL
  let poolLpMint: PublicKey;
  let poolAuthority: PublicKey;
  let poolBump: number;
  let pool: PublicKey;
  let tokenAVault: PublicKey;
  let tokenBVault: PublicKey;
  let userAAccount: PublicKey;
  let userBAccount: PublicKey;
  let userLpAccount: PublicKey;
  let feeAccount: PublicKey;

  const FEE_RATE = 100; // 1% (in basis points)
  const INITIAL_SUPPLY_A = 1_000_000_000; // 1 billion tokens
  const INITIAL_SUPPLY_B = 1000 * web3.LAMPORTS_PER_SOL; // 1000 SOL

  before(async () => {
    // Airdrop SOL to payer
    const signature = await provider.connection.requestAirdrop(
      wallet.publicKey,
      100 * web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Create Token A mint (memecoin)
    tokenAMint = Keypair.generate();
    const minRentForMint = await getMinimumBalanceForRentExemptMint(provider.connection);
    const createMintAccountTx = await provider.sendAndConfirm(
      new anchor.web3.Transaction()
        .add(
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: tokenAMint.publicKey,
            space: 82,
            lamports: minRentForMint,
            programId: TOKEN_PROGRAM_ID,
          })
        )
        .add(
          createInitializeMintInstruction(
            tokenAMint.publicKey,
            9, // 9 decimals
            wallet.publicKey,
            wallet.publicKey
          )
        ),
      [tokenAMint]
    );

    // Create Token B mint (SOL/WSOL simulator)
    tokenBMint = Keypair.generate();
    const createMintBAccountTx = await provider.sendAndConfirm(
      new anchor.web3.Transaction()
        .add(
          SystemProgram.createAccount({
            fromPubkey: wallet.publicKey,
            newAccountPubkey: tokenBMint.publicKey,
            space: 82,
            lamports: minRentForMint,
            programId: TOKEN_PROGRAM_ID,
          })
        )
        .add(
          createInitializeMintInstruction(
            tokenBMint.publicKey,
            9, // 9 decimals
            wallet.publicKey,
            wallet.publicKey
          )
        ),
      [tokenBMint]
    );

    // Create user token accounts
    userAAccount = await getAssociatedTokenAddress(
      tokenAMint.publicKey,
      wallet.publicKey
    );
    userBAccount = await getAssociatedTokenAddress(
      tokenBMint.publicKey,
      wallet.publicKey
    );

    // Create token accounts if they don't exist
    try {
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userAAccount,
            wallet.publicKey,
            tokenAMint.publicKey
          )
        )
      );
    } catch (e) {
      console.log("User A account may already exist");
    }

    try {
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userBAccount,
            wallet.publicKey,
            tokenBMint.publicKey
          )
        )
      );
    } catch (e) {
      console.log("User B account may already exist");
    }

    // Mint initial supplies to user
    await provider.sendAndConfirm(
      new anchor.web3.Transaction()
        .add(
          createMintToInstruction(
            tokenAMint.publicKey,
            userAAccount,
            wallet.publicKey,
            INITIAL_SUPPLY_A
          )
        )
        .add(
          createMintToInstruction(
            tokenBMint.publicKey,
            userBAccount,
            wallet.publicKey,
            INITIAL_SUPPLY_B
          )
        )
    );

    // Derive pool-related PDAs
    const [poolAuthPda, poolBumpSeed] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool_authority"),
        tokenAMint.publicKey.toBuffer(),
        tokenBMint.publicKey.toBuffer(),
      ],
      program.programId
    );
    poolAuthority = poolAuthPda;
    poolBump = poolBumpSeed;

    const [poolPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("pool"),
        tokenAMint.publicKey.toBuffer(),
        tokenBMint.publicKey.toBuffer(),
      ],
      program.programId
    );
    pool = poolPda;

    // Derive LP token mint PDA
    const [lpMintPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("lp_mint"),
        tokenAMint.publicKey.toBuffer(),
        tokenBMint.publicKey.toBuffer(),
      ],
      program.programId
    );
    poolLpMint = lpMintPda;

    // Create user LP token account
    userLpAccount = await getAssociatedTokenAddress(
      poolLpMint,
      wallet.publicKey
    );

    // Derive token vaults
    tokenAVault = await getAssociatedTokenAddress(
      tokenAMint.publicKey,
      poolAuthority,
      true
    );

    tokenBVault = await getAssociatedTokenAddress(
      tokenBMint.publicKey,
      poolAuthority,
      true
    );

    // Derive fee account
    const [feeAccountPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("fee_account"),
        tokenAMint.publicKey.toBuffer(),
        tokenBMint.publicKey.toBuffer(),
      ],
      program.programId
    );
    feeAccount = feeAccountPda;
  });

  it("Initialize pool", async () => {
    try {
      // Try to create LP token account in advance
      await provider.sendAndConfirm(
        new anchor.web3.Transaction().add(
          createAssociatedTokenAccountInstruction(
            wallet.publicKey,
            userLpAccount,
            wallet.publicKey,
            poolLpMint
          )
        )
      );
    } catch (e) {
      console.log("LP account creation will be handled by the program");
    }

    // Initialize the pool
    await program.methods
      .initializePool(FEE_RATE, poolBump)
      .accounts({
        authority: wallet.publicKey,
        pool: pool,
        tokenAMint: tokenAMint.publicKey,
        tokenBMint: tokenBMint.publicKey,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        lpMint: poolLpMint,
        feeAccount: feeAccount,
        poolAuthority: poolAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Verify pool was initialized
    const poolAccount = await program.account.pool.fetch(pool);
    assert.equal(poolAccount.tokenAMint.toString(), tokenAMint.publicKey.toString());
    assert.equal(poolAccount.tokenBMint.toString(), tokenBMint.publicKey.toString());
    assert.equal(poolAccount.tokenAVault.toString(), tokenAVault.toString());
    assert.equal(poolAccount.tokenBVault.toString(), tokenBVault.toString());
    assert.equal(poolAccount.lpMint.toString(), poolLpMint.toString());
    assert.equal(poolAccount.feeRate, FEE_RATE);
    assert.equal(poolAccount.feeAccount.toString(), feeAccount.toString());
    assert.equal(poolAccount.authority.toString(), wallet.publicKey.toString());
    assert.equal(poolAccount.bump, poolBump);
  });

  it("Add balanced liquidity", async () => {
    const amountADesired = 1_000_000; // 1 million token A
    const amountBDesired = 10 * web3.LAMPORTS_PER_SOL; // 10 SOL
    
    // Get initial balances
    const userABalanceBefore = await provider.connection.getTokenAccountBalance(userAAccount);
    const userBBalanceBefore = await provider.connection.getTokenAccountBalance(userBAccount);
    
    // Add liquidity
    await program.methods
      .addLiquidity(
        new BN(amountADesired),
        new BN(amountBDesired),
        new BN(0), // Allow any slippage for testing
        new BN(0)  // Allow any slippage for testing
      )
      .accounts({
        user: wallet.publicKey,
        pool: pool,
        tokenAMint: tokenAMint.publicKey,
        tokenBMint: tokenBMint.publicKey,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        userTokenA: userAAccount,
        userTokenB: userBAccount,
        lpMint: poolLpMint,
        userLpToken: userLpAccount,
        poolAuthority: poolAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
      
    // Verify token balances changed
    const userABalanceAfter = await provider.connection.getTokenAccountBalance(userAAccount);
    const userBBalanceAfter = await provider.connection.getTokenAccountBalance(userBAccount);
    const userLpBalance = await provider.connection.getTokenAccountBalance(userLpAccount);
    
    // Check that tokens were transferred
    assert(Number(userABalanceAfter.value.amount) < Number(userABalanceBefore.value.amount));
    assert(Number(userBBalanceAfter.value.amount) < Number(userBBalanceBefore.value.amount));
    
    // Check that LP tokens were minted
    assert(Number(userLpBalance.value.amount) > 0);
    
    console.log("User received LP tokens:", userLpBalance.value.uiAmount);
  });

  it("Swap token A for token B", async () => {
    const amountIn = 1_000_000; // 1 million token A
    
    // Get initial balances
    const userABalanceBefore = await provider.connection.getTokenAccountBalance(userAAccount);
    const userBBalanceBefore = await provider.connection.getTokenAccountBalance(userBAccount);
    
    // Perform swap
    await program.methods
      .swap(
        new BN(amountIn),
        new BN(0) // Allow any slippage for testing
      )
      .accounts({
        user: wallet.publicKey,
        pool: pool,
        tokenAMint: tokenAMint.publicKey,
        tokenBMint: tokenBMint.publicKey,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        userTokenA: userAAccount,
        userTokenB: userBAccount,
        poolAuthority: poolAuthority,
        feeAccount: feeAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
      
    // Verify token balances changed
    const userABalanceAfter = await provider.connection.getTokenAccountBalance(userAAccount);
    const userBBalanceAfter = await provider.connection.getTokenAccountBalance(userBAccount);
    
    // Check that token A decreased and token B increased
    assert(Number(userABalanceAfter.value.amount) < Number(userABalanceBefore.value.amount));
    assert(Number(userBBalanceAfter.value.amount) > Number(userBBalanceBefore.value.amount));
    
    console.log("Swap details:");
    console.log("- Token A spent:", 
      (Number(userABalanceBefore.value.amount) - Number(userABalanceAfter.value.amount)) / 1e9);
    console.log("- Token B received:", 
      (Number(userBBalanceAfter.value.amount) - Number(userBBalanceBefore.value.amount)) / 1e9);
  });

  it("Add single-sided liquidity", async () => {
    const amountIn = 5_000_000; // 5 million token A
    
    // Get initial balances
    const userABalanceBefore = await provider.connection.getTokenAccountBalance(userAAccount);
    const lpBalanceBefore = await provider.connection.getTokenAccountBalance(userLpAccount);
    
    // Add single-sided liquidity
    await program.methods
      .addSingleSidedLiquidity(
        new BN(amountIn)
      )
      .accounts({
        user: wallet.publicKey,
        pool: pool,
        tokenAMint: tokenAMint.publicKey,
        tokenBMint: tokenBMint.publicKey,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        userTokenA: userAAccount,
        lpMint: poolLpMint,
        userLpToken: userLpAccount,
        poolAuthority: poolAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
      
    // Verify token balances changed
    const userABalanceAfter = await provider.connection.getTokenAccountBalance(userAAccount);
    const lpBalanceAfter = await provider.connection.getTokenAccountBalance(userLpAccount);
    
    // Check that token A decreased
    assert(Number(userABalanceAfter.value.amount) < Number(userABalanceBefore.value.amount));
    // Check that LP tokens increased
    assert(Number(lpBalanceAfter.value.amount) > Number(lpBalanceBefore.value.amount));
    
    console.log("Single-sided liquidity added:");
    console.log("- Token A deposited:", 
      (Number(userABalanceBefore.value.amount) - Number(userABalanceAfter.value.amount)) / 1e9);
    console.log("- LP tokens received:", 
      (Number(lpBalanceAfter.value.amount) - Number(lpBalanceBefore.value.amount)) / 1e9);
  });

  it("Remove liquidity", async () => {
    // Get LP balance to remove half of it
    const lpBalanceBefore = await provider.connection.getTokenAccountBalance(userLpAccount);
    const lpAmountToRemove = Math.floor(Number(lpBalanceBefore.value.amount) / 2);
    
    // Get initial token balances
    const userABalanceBefore = await provider.connection.getTokenAccountBalance(userAAccount);
    const userBBalanceBefore = await provider.connection.getTokenAccountBalance(userBAccount);
    
    // Remove liquidity
    await program.methods
      .removeLiquidity(
        new BN(lpAmountToRemove),
        new BN(0), // Allow any slippage for testing
        new BN(0)  // Allow any slippage for testing
      )
      .accounts({
        user: wallet.publicKey,
        pool: pool,
        tokenAMint: tokenAMint.publicKey,
        tokenBMint: tokenBMint.publicKey,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        userTokenA: userAAccount,
        userTokenB: userBAccount,
        lpMint: poolLpMint,
        userLpToken: userLpAccount,
        poolAuthority: poolAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
      
    // Verify token balances changed
    const userABalanceAfter = await provider.connection.getTokenAccountBalance(userAAccount);
    const userBBalanceAfter = await provider.connection.getTokenAccountBalance(userBAccount);
    const lpBalanceAfter = await provider.connection.getTokenAccountBalance(userLpAccount);
    
    // Check that token balances increased and LP decreased
    assert(Number(userABalanceAfter.value.amount) > Number(userABalanceBefore.value.amount));
    assert(Number(userBBalanceAfter.value.amount) > Number(userBBalanceBefore.value.amount));
    assert(Number(lpBalanceAfter.value.amount) < Number(lpBalanceBefore.value.amount));
    
    console.log("Liquidity removed:");
    console.log("- LP tokens burned:", 
      (Number(lpBalanceBefore.value.amount) - Number(lpBalanceAfter.value.amount)) / 1e9);
    console.log("- Token A received:", 
      (Number(userABalanceAfter.value.amount) - Number(userABalanceBefore.value.amount)) / 1e9);
    console.log("- Token B received:", 
      (Number(userBBalanceAfter.value.amount) - Number(userBBalanceBefore.value.amount)) / 1e9);
  });

  it("Collect fees", async () => {
    // Create fee recipient accounts
    const feeRecipientA = await getAssociatedTokenAddress(
      tokenAMint.publicKey,
      wallet.publicKey
    );
    
    const feeRecipientB = await getAssociatedTokenAddress(
      tokenBMint.publicKey,
      wallet.publicKey
    );
    
    // Get initial fee account balances (if available)
    let feeAccountABalance;
    let feeAccountBBalance;
    
    try {
      feeAccountABalance = await provider.connection.getTokenAccountBalance(feeAccount);
    } catch (e) {
      console.log("Fee account A balance not available");
    }
    
    // Collect fees
    await program.methods
      .collectFees()
      .accounts({
        authority: wallet.publicKey,
        pool: pool,
        tokenAVault: tokenAVault,
        tokenBVault: tokenBVault,
        feeRecipientA: feeRecipientA,
        feeRecipientB: feeRecipientB,
        poolAuthority: poolAuthority,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();
      
    console.log("Fees collected successfully");
  });

  // Add tests for full protocol flow integration
  it("Integration test: Create token -> Add liquidity -> Evolve", async () => {
    // This would be a more complex test that ties together all protocol features
    console.log("Full integration test would go here");
  });

  // Add test for circuit breaker
  it("Activates circuit breaker during extreme volatility", async () => {
    // Setup extreme price change
    const largeAmount = 1_000_000_000; // Very large amount
    
    // Execute swap to trigger volatility
    await program.methods
      .swap(new BN(largeAmount), new BN(0))
      .accounts({
        // ... account setup
      })
      .rpc();
      
    // Verify circuit breaker activation
    const poolState = await program.account.pool.fetch(poolPda);
    assert.isTrue(poolState.circuitBreakerActive);
    
    // Try another swap, should fail with CircuitBreakerActive
    try {
      await program.methods
        .swap(new BN(largeAmount), new BN(0))
        .accounts({
          // ... account setup
        })
        .rpc();
      assert.fail("Expected error due to circuit breaker");
    } catch (err) {
      assert.include(err.toString(), "CircuitBreakerActive");
    }
  });
});
