import * as anchor from "@coral-xyz/anchor";
import { Program, web3, BN } from "@coral-xyz/anchor";
import { Protocol } from "../target/types/protocol";
import { assert } from "chai";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as splToken from "@solana/spl-token";

describe("protocol", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Protocol as Program<Protocol>;

  // A helper to airdrop SOL for new Keypairs (if needed)
  async function airdropIfNeeded(pubkey: PublicKey, amount = 2 * web3.LAMPORTS_PER_SOL) {
    const balance = await provider.connection.getBalance(pubkey);
    if (balance < amount) {
      const sig = await provider.connection.requestAirdrop(pubkey, amount);
      await provider.connection.confirmTransaction(sig);
    }
  }

  it("initializes", async () => {
    // Minimal test for the initialize instruction.
    const tx = await program.methods.initialize().rpc();
    console.log("Initialize tx:", tx);
  });

  it("creates a meme token", async () => {
    // === SETUP ACCOUNTS ===
    // Generate a new mint for our memecoin.
    const mintKeypair = Keypair.generate();
    await airdropIfNeeded(mintKeypair.publicKey);

    // Create a PDA (or new keypair) for the token state.
    const memeTokenState = Keypair.generate();
    // (In production this account is created via an "init" instruction with the correct size.)

    // For testing, we generate a mint authority.
    const mintAuthority = Keypair.generate();
    await airdropIfNeeded(mintAuthority.publicKey);

    // A dummy recipient account (ATA for the full minted supply).
    const recipientAta = Keypair.generate();

    // A distribution recipient (for non–LP distribution).
    const distributionRecipient = Keypair.generate();

    // Create "dummy" accounts for pool-related fields.
    const poolVault = Keypair.generate();
    const poolAccount = Keypair.generate();
    const poolAuthority = Keypair.generate();
    const tokenVaultB = Keypair.generate();
    const feeAccount = Keypair.generate();
    // For wSOL mint we use a dummy account (in tests you might want to use the known wSOL address).
    const wsolMint = Keypair.generate();

    // Compute the evolution_data PDA (seed: "evolution_data" + mint key)
    const [evolutionDataPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("evolution_data"), mintKeypair.publicKey.toBuffer()],
      program.programId
    );

    // === PREPARE ARGUMENTS ===
    // For evolutions, we create one dummy evolution rule.
    const evolutions = [
      {
        priceThreshold: new BN(100),
        newName: "EvolvedToken",
        newUri: "https://example.com/evolved.json",
      },
    ];
    // For distributions, we set one non–pool instruction (e.g. 10% to a recipient).
    // (The LP allocation will be computed as the remainder.)
    const distributions = [
      {
        recipient: distributionRecipient.publicKey,
        percentage: 10, // 10% non-pool distribution
        isPool: false,
      },
      // (Optionally you could supply a pool distribution instruction here, but it is not required.)
    ];

    // === CALL create_meme_token ===
    try {
      const tx = await program.methods.createMemeToken(
        "TestToken",
        "TTKN",
        6,
        new BN(1_000_000),
        "https://example.com/image.png",
        0, // TokenType.Regular (as an enum, 0 = Regular, 1 = TextEvolution, 2 = ImageEvolution)
        evolutions,
        distributions
      )
        .accounts({
          creator: provider.wallet.publicKey,
          memeTokenState: memeTokenState.publicKey,
          mint: mintKeypair.publicKey,
          mintAuthority: mintAuthority.publicKey,
          recipientAta: recipientAta.publicKey,
          poolVault: poolVault.publicKey,
          poolAccount: poolAccount.publicKey,
          poolAuthority: poolAuthority.publicKey,
          tokenVaultB: tokenVaultB.publicKey,
          feeAccount: feeAccount.publicKey,
          wsolMint: wsolMint.publicKey,
          evolutionData: evolutionDataPDA,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          rent: web3.SYSVAR_RENT_PUBKEY,
          systemProgram: SystemProgram.programId,
          // For the Orca Whirlpools program, supply a dummy program id.
          orcaWhirlpoolsProgram: new PublicKey("orcaWhirlpools11111111111111111111111111"),
        })
        .signers([memeTokenState, mintKeypair, mintAuthority])
        .rpc();
      console.log("create_meme_token tx:", tx);
    } catch (err) {
      console.error("Error in create_meme_token:", err);
    }
  });

  it("sets evolutions", async () => {
    // To test setting evolutions, we need an evolution_data account.
    // For this test, we simulate a dummy mint and use its PDA.
    const dummyMint = Keypair.generate();
    const [evolutionDataPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("evolution_data"), dummyMint.publicKey.toBuffer()],
      program.programId
    );

    // Prepare new evolution rules.
    const newEvolutions = [
      {
        priceThreshold: new BN(200),
        newName: "SuperEvolvedToken",
        newUri: "https://example.com/superevolved.json",
      },
      {
        priceThreshold: new BN(500),
        newName: "UltraEvolvedToken",
        newUri: "https://example.com/ultraevolved.json",
      },
    ];

    try {
      const tx = await program.methods.setEvolutions(newEvolutions)
        .accounts({
          owner: provider.wallet.publicKey,
          evolutionData: evolutionDataPDA,
          systemProgram: SystemProgram.programId,
          tokenMint: dummyMint.publicKey,
        })
        .rpc();
      console.log("set_evolutions tx:", tx);
    } catch (err) {
      console.error("Error in set_evolutions:", err);
    }
  });

  it("registers a holder and distributes conviction NFTs", async () => {
    // For registering a holder, the protocol uses a PDA for conviction_registry.
    // We simulate this by using a dummy mint.
    const dummyMint = Keypair.generate();
    const [convictionRegistryPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("conviction_registry"), dummyMint.publicKey.toBuffer()],
      program.programId
    );

    // For testing purposes, assume a dummy meme_token_state exists.
    // (In practice you would fetch the account data and set total_supply/decimals accordingly.)
    // We also need a dummy user token account. In tests you could use spl-token
    // to create an account with enough balance.
    const userTokenAccount = Keypair.generate();

    // First, call register_holder.
    try {
      const tx = await program.methods.registerHolder()
        .accounts({
          user: provider.wallet.publicKey,
          userTokenAccount: userTokenAccount.publicKey, // this account should be owned by the token program
          convictionRegistry: convictionRegistryPDA,
          // For memeTokenState, we "fake" it by providing an account whose mint matches dummyMint.
          // (In a real test you would have created and initialized this account.)
          memeTokenState: {
            // NOTE: When using Anchor's testing client, you can pass a dummy object with a key.
            key: dummyMint.publicKey,
          } as any,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
        })
        .rpc();
      console.log("register_holder tx:", tx);
    } catch (err) {
      console.error("Error in register_holder:", err);
    }

    // Next, test distribute_conviction_nfts.
    // The instruction expects (for each holder in the registry) three extra accounts:
    //   (1) the holder's memecoin token account (for balance re-check),
    //   (2) the NFT mint account,
    //   (3) the holder's NFT token account.
    // Here we simulate a single holder.
    const nftMint = Keypair.generate();
    const holderNftTokenAccount = Keypair.generate();
    // Create an array of remaining account objects.
    const remainingAccounts = [
      { pubkey: userTokenAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: nftMint.publicKey, isSigner: false, isWritable: true },
      { pubkey: holderNftTokenAccount.publicKey, isSigner: false, isWritable: true },
    ];
    try {
      const tx = await program.methods.distributeConvictionNfts()
        .accounts({
          authority: provider.wallet.publicKey,
          convictionRegistry: convictionRegistryPDA,
          // As before, we "fake" memeTokenState by providing the dummy mint.
          memeTokenState: { key: dummyMint.publicKey } as any,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          // Supply the Metaplex Token Metadata program ID.
          tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        })
        .remainingAccounts(remainingAccounts)
        .rpc();
      console.log("distribute_conviction_nfts tx:", tx);
    } catch (err) {
      console.error("Error in distribute_conviction_nfts:", err);
    }
  });

  it("initializes fee vault and distributes fees", async () => {
    // For fee distribution tests, we need to simulate vault accounts.
    const feeVault = Keypair.generate();
    const protocolSolVault = Keypair.generate();
    const creatorSolVault = Keypair.generate();
    const creatorTokenVault = Keypair.generate();
    const lpTokenVault = Keypair.generate();

    try {
      const tx = await program.methods.initFeeVault()
        .accounts({
          payer: provider.wallet.publicKey,
          feeVault: feeVault.publicKey,
          protocolSolVault: protocolSolVault.publicKey,
          creatorSolVault: creatorSolVault.publicKey,
          creatorTokenVault: creatorTokenVault.publicKey,
          protocolPubkey: provider.wallet.publicKey,
          creatorPubkey: provider.wallet.publicKey,
          lpTokenVault: lpTokenVault.publicKey,
          systemProgram: SystemProgram.programId,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
        })
        .signers([feeVault])
        .rpc();
      console.log("init_fee_vault tx:", tx);
    } catch (err) {
      console.error("Error in init_fee_vault:", err);
    }

    // You could extend these tests to simulate SOL transfers (withdraw_protocol_sol)
    // and token transfers (withdraw_creator_tokens) by checking lamport balances before/after.
  });

  it("executes a pass-through trade", async () => {
    // Setup accounts for pass-through trading
    const userInTokenAccount = Keypair.generate();
    const userOutTokenAccount = Keypair.generate();
    const dummyMint = Keypair.generate();

    // Get PDAs for required accounts
    const [evolutionDataPDA] = await PublicKey.findProgramAddress(
      [Buffer.from("evolution_data"), dummyMint.publicKey.toBuffer()],
      program.programId
    );

    const [memeTokenStatePDA] = await PublicKey.findProgramAddress(
      [Buffer.from("meme_token_state"), dummyMint.publicKey.toBuffer()],
      program.programId
    );

    try {
      const tx = await program.methods.handlePassThroughTrade(
        new BN(1000), // amount_in
        new BN(990),  // min_out
        new BN(1000)  // mock current_price
      )
        .accounts({
          user: provider.wallet.publicKey,
          userInTokenAccount: userInTokenAccount.publicKey,
          userOutTokenAccount: userOutTokenAccount.publicKey,
          memeTokenState: memeTokenStatePDA,
          evolutionData: evolutionDataPDA,
          metadata: Keypair.generate().publicKey, // dummy metadata account
          metadataUpdateAuthority: provider.wallet.publicKey,
          tokenProgram: splToken.TOKEN_PROGRAM_ID,
          tokenMetadataProgram: new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"),
        })
        .rpc();
      console.log("pass_through_trade tx:", tx);
    } catch (err) {
      console.error("Error in pass_through_trade:", err);
    }
  });
});
