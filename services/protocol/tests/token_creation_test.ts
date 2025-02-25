import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Protocol } from "../target/types/protocol";
import {
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createAssociatedTokenAccountInstruction,
  createInitializeMintInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  getMinimumBalanceForRentExemptMint,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import * as assert from "assert";

describe("token creation with simpleAMM", () => {
  // Configure the client to use the local cluster
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Protocol as Program<Protocol>;
  const wallet = provider.wallet as anchor.Wallet;

  it("Creates a new meme token with SimpleAMM pool", async () => {
    // Generate keypairs and accounts
    const tokenMint = Keypair.generate();
    const wsolMint = Keypair.generate();
    const memeTokenStateAccount = Keypair.generate();
    const lpMint = Keypair.generate();
    
    // Derive evolution data PDA
    const [evolutionData] = PublicKey.findProgramAddressSync(
      [Buffer.from("evolution_data"), tokenMint.publicKey.toBuffer()],
      program.programId
    );
    
    // Request SOL airdrop for testing
    await provider.connection.requestAirdrop(
      wallet.publicKey,
      5 * LAMPORTS_PER_SOL
    );
    
    // Initialize token accounts
    const MINT_SIZE = 82;
    const tx = new Transaction();
    
    // Create token mints
    tx.add(
      SystemProgram.createAccount({
        fromPubkey: wallet.publicKey,
        newAccountPubkey: tokenMint.publicKey,
        space: MINT_SIZE,
        lamports: await provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE),
        programId: TOKEN_PROGRAM_ID,
      })
    );
    
    // Create recipient token account
    const recipientAta = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      wallet.publicKey
    );
    
    // Create LP mint
    const lpMint = Keypair.generate();
    
    // Derive PDAs for pool components
    const [poolAuthority, poolBump] = await PublicKey.findProgramAddress(
      [
        Buffer.from("pool_authority"),
        tokenMint.publicKey.toBuffer(),
        wsolMint.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    const [poolPda] = await PublicKey.findProgramAddress(
      [
        Buffer.from("pool"),
        tokenMint.publicKey.toBuffer(),
        wsolMint.publicKey.toBuffer(),
      ],
      program.programId
    );
    
    // Create token vaults
    const tokenAVault = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      poolAuthority,
      true
    );
    
    const tokenBVault = await getAssociatedTokenAddress(
      wsolMint.publicKey,
      poolAuthority,
      true
    );
    
    // Create fee account
    const feeAccount = await getAssociatedTokenAddress(
      tokenMint.publicKey,
      wallet.publicKey,
      false
    );
    
    // Create user LP token account
    const userLpAccount = await getAssociatedTokenAddress(
      lpMint.publicKey,
      wallet.publicKey,
      false
    );
    
    // Mock evolution thresholds for the token
    const evolutions = [
      {
        threshold: new anchor.BN(10 * LAMPORTS_PER_SOL), // 10 SOL market cap
        name: "Level 1 Meme",
        uri: "https://example.com/level1.json",
      },
      {
        threshold: new anchor.BN(100 * LAMPORTS_PER_SOL), // 100 SOL market cap
        name: "Level 2 Meme",
        uri: "https://example.com/level2.json",
      },
    ];
    
    // Token distribution for initial issuance
    const distributions = [
      {
        recipient: recipientAta, // Team allocation
        percentage: 15,
        isPool: false,
      },
      {
        recipient: poolPda, // Pool allocation
        percentage: 65,
        isPool: true,
      },
    ];
    
    // Create token with SimpleAMM pool
    await program.methods
      .createMemeToken(
        "Meme Token",
        "MEME",
        9, // Decimals
        new anchor.BN(1_000_000_000), // 1 billion total supply
        "https://example.com/image.png",
        { regular: {} }, // Token type
        evolutions,
        distributions
      )
      .accounts({
        creator: wallet.publicKey,
        memeTokenState: memeTokenStateAccount.publicKey,
        mint: tokenMint.publicKey,
        mintAuthority: wallet.publicKey,
        recipientAta: recipientAta,
        poolVault: tokenAVault,
        poolAccount: poolPda,
        poolAuthority: poolAuthority,
        tokenVaultB: tokenBVault,
        feeAccount: feeAccount,
        wsolMint: wsolMint.publicKey,
        lpMint: lpMint.publicKey,
        userLpToken: userLpAccount,
        evolutionData: evolutionData,
        tokenProgram: TOKEN_PROGRAM_ID,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId,
        program: program.programId,
        remainingAtas: [recipientAta],
      })
      .signers([tokenMint, memeTokenStateAccount])
      .rpc();
    
    console.log("Token created with SimpleAMM pool!");
    
    // Fetch and verify the new token state and pool
    const tokenState = await program.account.memeTokenState.fetch(
      memeTokenStateAccount.publicKey
    );
    
    assert.equal(tokenState.name, "Meme Token");
    assert.equal(tokenState.symbol, "MEME");
    assert.equal(tokenState.totalSupply.toNumber(), 1_000_000_000);
    
    const pool = await program.account.pool.fetch(poolPda);
    assert.equal(pool.tokenAMint.toBase58(), tokenMint.publicKey.toBase58());
    assert.equal(pool.tokenBMint.toBase58(), wsolMint.publicKey.toBase58());
    assert.equal(pool.feeRate, 100); // 1%
    
    console.log("Token and pool verified successfully!");
  });
}); 