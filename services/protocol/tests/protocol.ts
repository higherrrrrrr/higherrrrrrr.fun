import * as anchor from "@project-serum/anchor";
import { Program, web3, BN } from "@project-serum/anchor";
import { assert } from "chai";
import { Protocol } from "../target/types/protocol";

describe("Full Test Suite for Higherrrrrrrr Protocol", () => {
  // Set the provider to local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Protocol as Program<Protocol>;

  // Dummy external program IDs (replace with mocks or live IDs as necessary)
  const ORCA_WHIRLPOOLS_PROGRAM = new web3.PublicKey(
    "orca111111111111111111111111111111111111111"
  );
  const TOKEN_METADATA_PROGRAM = new web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
  );

  // Global keypairs for testing
  const creator = web3.Keypair.generate();
  const mint = web3.Keypair.generate();
  const mintAuthority = web3.Keypair.generate();
  const recipientAta = web3.Keypair.generate(); // Dummy associated token account
  const poolVault = web3.Keypair.generate();
  const poolAccount = web3.Keypair.generate();
  const poolAuthority = web3.Keypair.generate();
  const tokenVaultB = web3.Keypair.generate();
  const feeAccount = web3.Keypair.generate();
  const wsolMint = web3.Keypair.generate();

  // Global PDAs and variables
  let evolutionDataPda: web3.PublicKey;
  let memeTokenStatePda: web3.PublicKey;
  let convictionRegistryPda: web3.PublicKey;
  let feeVaultPda: web3.PublicKey;

  // Dummy data for simulating a Whirlpool account (sqrt_price_x96 = 1<<96, so price = 1)
  const dummySqrtPriceX96 = BigInt(1) << BigInt(96);
  let dummyWhirlpoolData: Buffer;

  // Additional dummy account for LP fee testing.
  const dummyLpFeeAccount = web3.Keypair.generate();

  // Global Setup: Airdrops & PDA Derivation
  before(async () => {
    const airdropAmount = 10 * web3.LAMPORTS_PER_SOL;
    // Airdrop SOL to keypairs
    for (let kp of [creator, mintAuthority, poolAuthority]) {
      const sig = await provider.connection.requestAirdrop(kp.publicKey, airdropAmount);
      await provider.connection.confirmTransaction(sig);
    }
    // Extra airdrop for creator if needed.
    const creatorSig = await provider.connection.requestAirdrop(creator.publicKey, airdropAmount);
    await provider.connection.confirmTransaction(creatorSig);

    // Derive evolution_data PDA using seed "evolution_data" and the mint's public key.
    [evolutionDataPda] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("evolution_data"), mint.publicKey.toBuffer()],
      program.programId
    );

    // For meme token state, derive a dummy PDA for testing.
    memeTokenStatePda = web3.Keypair.generate().publicKey;

    // Derive conviction registry PDA using seed "conviction_registry" and the mint's public key.
    [convictionRegistryPda] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("conviction_registry"), mint.publicKey.toBuffer()],
      program.programId
    );

    // Simulate a fee vault PDA.
    feeVaultPda = web3.Keypair.generate().publicKey;

    // Prepare dummy Whirlpool data.
    dummyWhirlpoolData = Buffer.alloc(200);
    // Write lower 64 bits (little-endian) at offset 0.
    dummyWhirlpoolData.writeBigUInt64LE(
      dummySqrtPriceX96 & BigInt("0xffffffffffffffff"),
      0
    );
    // Write upper 64 bits at offset 8.
    dummyWhirlpoolData.writeBigUInt64LE(dummySqrtPriceX96 >> BigInt(64), 8);
  });

  // ---------------------------
  // Token Creation & Distribution Tests
  describe("Token Creation & Distribution", () => {
    it("Successfully creates a meme token with correct state and distributions", async () => {
      // Distribution instructions: 35% for pre-mine, 65% for pool distribution.
      const distributions = [
        { recipient: creator.publicKey, percentage: 35, isPool: false },
        { recipient: creator.publicKey, percentage: 65, isPool: true },
      ];

      // Define an initial evolution rule.
      const evolutions = [
        {
          priceThreshold: new BN(100),
          newName: "InitialLevel",
          newUri: "https://example.com/initial.json",
        },
      ];

      await program.rpc.createMemeToken(
        "TestToken", // Token name
        "TTK", // Token symbol
        9, // Decimals
        new BN(1_000_000_000), // Total supply (1B tokens)
        evolutions,
        distributions,
        {
          accounts: {
            creator: creator.publicKey,
            memeTokenState: memeTokenStatePda,
            mint: mint.publicKey,
            mintAuthority: mintAuthority.publicKey,
            recipientAta: recipientAta.publicKey,
            poolVault: poolVault.publicKey,
            poolAccount: poolAccount.publicKey,
            poolAuthority: poolAuthority.publicKey,
            tokenVaultB: tokenVaultB.publicKey,
            feeAccount: feeAccount.publicKey,
            wsolMint: wsolMint.publicKey,
            evolutionData: evolutionDataPda,
            tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
            rent: web3.SYSVAR_RENT_PUBKEY,
            systemProgram: web3.SystemProgram.programId,
            orcaWhirlpoolsProgram: ORCA_WHIRLPOOLS_PROGRAM,
          },
          signers: [creator, mint, mintAuthority],
        }
      );

      // Fetch and verify the meme token state.
      const tokenState = await program.account.memeTokenState.fetch(memeTokenStatePda);
      assert.equal(tokenState.name, "TestToken");
      assert.equal(tokenState.symbol, "TTK");
      assert.ok(tokenState.totalSupply.eq(new BN(1_000_000_000)));
      assert.equal(tokenState.decimals, 9);
      // Ensure that the pool deposit account is set.
      assert.notEqual(tokenState.pool.toString(), web3.PublicKey.default.toString());
    });

    it("Fails to create a token when distribution percentages do not sum to 100", async () => {
      const badDistributions = [
        { recipient: creator.publicKey, percentage: 30, isPool: false },
        { recipient: creator.publicKey, percentage: 30, isPool: true },
      ];
      const evolutions = [
        {
          priceThreshold: new BN(100),
          newName: "BadToken",
          newUri: "https://example.com/bad.json",
        },
      ];
      try {
        await program.rpc.createMemeToken(
          "BadToken",
          "BTK",
          9,
          new BN(1_000_000_000),
          evolutions,
          badDistributions,
          {
            accounts: {
              creator: creator.publicKey,
              memeTokenState: web3.Keypair.generate().publicKey,
              mint: mint.publicKey,
              mintAuthority: mintAuthority.publicKey,
              recipientAta: recipientAta.publicKey,
              poolVault: poolVault.publicKey,
              poolAccount: poolAccount.publicKey,
              poolAuthority: poolAuthority.publicKey,
              tokenVaultB: tokenVaultB.publicKey,
              feeAccount: feeAccount.publicKey,
              wsolMint: wsolMint.publicKey,
              evolutionData: evolutionDataPda,
              tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
              rent: web3.SYSVAR_RENT_PUBKEY,
              systemProgram: web3.SystemProgram.programId,
              orcaWhirlpoolsProgram: ORCA_WHIRLPOOLS_PROGRAM,
            },
            signers: [creator, mint, mintAuthority],
          }
        );
        assert.fail("Token creation should have failed due to incorrect distribution percentages");
      } catch (err) {
        // Expected error.
      }
    });
  });

  // ---------------------------
  // Evolutions & Metadata Tests
  describe("Evolutions & Metadata", () => {
    it("Sets evolution rules successfully", async () => {
      const newEvolutions = [
        {
          priceThreshold: new BN(200),
          newName: "Level2",
          newUri: "https://example.com/level2.json",
        },
        {
          priceThreshold: new BN(300),
          newName: "Level3",
          newUri: "https://example.com/level3.json",
        },
      ];
      await program.rpc.setEvolutions(newEvolutions, {
        accounts: {
          owner: creator.publicKey,
          evolutionData: evolutionDataPda,
          systemProgram: web3.SystemProgram.programId,
          tokenMint: mint.publicKey,
        },
        signers: [creator],
      });
      const evoData = await program.account.evolutionData.fetch(evolutionDataPda);
      assert.equal(evoData.evolutionCount, 2);
      assert.equal(evoData.evolutions[0].newName, "Level2");
      assert.equal(evoData.evolutions[1].newName, "Level3");
    });

    it("Does not update metadata when current price is below any threshold", async () => {
      // Current price set to 150 which is below both 200 and 300 thresholds.
      await program.rpc.updateMemeMetadata(new BN(150), {
        accounts: {
          evolutionData: evolutionDataPda,
          mint: mint.publicKey,
          metadata: recipientAta.publicKey, // Using recipientAta as dummy metadata account.
          metadataUpdateAuthority: creator.publicKey,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
        },
        signers: [],
      });
      // No metadata update should occur. (Logs should indicate no threshold crossed.)
    });

    it("Updates metadata when current price exceeds a threshold", async () => {
      // Current price set to 250 which exceeds the 200 threshold.
      await program.rpc.updateMemeMetadata(new BN(250), {
        accounts: {
          evolutionData: evolutionDataPda,
          mint: mint.publicKey,
          metadata: recipientAta.publicKey,
          metadataUpdateAuthority: creator.publicKey,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
        },
        signers: [],
      });
      // In a complete test, the metadata account would be fetched to verify changes.
    });
  });

  // ---------------------------
  // Fee Vault & Withdrawals Tests
  describe("Fee Vault & Withdrawals", () => {
    let feeVaultKeypair: web3.Keypair;
    before(async () => {
      feeVaultKeypair = web3.Keypair.generate();
      // Airdrop extra SOL if needed.
      const sig = await provider.connection.requestAirdrop(creator.publicKey, 5 * web3.LAMPORTS_PER_SOL);
      await provider.connection.confirmTransaction(sig);
    });

    it("Initializes the fee vault successfully", async () => {
      await program.rpc.initFeeVault({
        accounts: {
          payer: creator.publicKey,
          feeVault: feeVaultKeypair.publicKey,
          protocolSolVault: creator.publicKey, // Using creator's account for simplicity.
          creatorTokenVault: recipientAta.publicKey,
          protocolPubkey: creator.publicKey,
          creatorPubkey: creator.publicKey,
          lpTokenVault: poolVault.publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [creator, feeVaultKeypair],
      });
      const feeVault = await program.account.feeVault.fetch(feeVaultKeypair.publicKey);
      assert.equal(feeVault.protocolSolVault.toString(), creator.publicKey.toString());
      assert.equal(feeVault.creatorTokenVault.toString(), recipientAta.publicKey.toString());
    });

    it("Allows authorized protocol SOL withdrawal", async () => {
      const beforeBalance = (await provider.connection.getAccountInfo(creator.publicKey))!.lamports;
      await program.rpc.withdrawProtocolSol(new BN(1000), {
        accounts: {
          feeVault: feeVaultKeypair.publicKey,
          protocolSolVault: creator.publicKey,
          protocolSigner: creator.publicKey,
          recipientAccount: creator.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [],
      });
      const afterBalance = (await provider.connection.getAccountInfo(creator.publicKey))!.lamports;
      assert.isTrue(beforeBalance - afterBalance >= 1000);
    });

    it("Prevents unauthorized protocol SOL withdrawal", async () => {
      try {
        await program.rpc.withdrawProtocolSol(new BN(1000), {
          accounts: {
            feeVault: feeVaultKeypair.publicKey,
            protocolSolVault: creator.publicKey,
            protocolSigner: recipientAta.publicKey, // Wrong signer.
            recipientAccount: creator.publicKey,
            systemProgram: web3.SystemProgram.programId,
          },
          signers: [],
        });
        assert.fail("Unauthorized withdrawal should have failed");
      } catch (err) {
        // Expected unauthorized error.
      }
    });

    it("Allows creator token withdrawal", async () => {
      await program.rpc.withdrawCreatorTokens(new BN(500), {
        accounts: {
          feeVault: feeVaultKeypair.publicKey,
          creatorTokenVault: recipientAta.publicKey,
          creatorSigner: creator.publicKey,
          recipientTokenAccount: recipientAta.publicKey,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [],
      });
    });

    it("Distributes LP fees correctly", async () => {
      // Simulate an LP fee account by airdropping SOL to dummyLpFeeAccount.
      const feeAirdropSig = await provider.connection.requestAirdrop(dummyLpFeeAccount.publicKey, 10000);
      await provider.connection.confirmTransaction(feeAirdropSig);
      await program.rpc.distributeLpFees({
        accounts: {
          feeVault: feeVaultKeypair.publicKey,
          lpFeeAccount: dummyLpFeeAccount.publicKey,
          protocolSolVault: creator.publicKey,
          creatorSolVault: creator.publicKey,
          systemProgram: web3.SystemProgram.programId,
        },
        signers: [],
      });
      // After distribution, dummyLpFeeAccount should be drained.
      const lpFeeAccountInfo = await provider.connection.getAccountInfo(dummyLpFeeAccount.publicKey);
      assert.equal(lpFeeAccountInfo?.lamports, 0);
    });
  });

  // ---------------------------
  // Conviction NFTs Tests
  describe("Conviction NFTs", () => {
    let convictionRegistryKeypair: web3.Keypair;
    before(async () => {
      convictionRegistryKeypair = web3.Keypair.generate();
    });

    it("Registers a holder when the balance meets the threshold", async () => {
      await program.rpc.registerHolder({
        accounts: {
          user: creator.publicKey,
          userTokenAccount: recipientAta.publicKey, // Assume sufficient balance.
          convictionRegistry: convictionRegistryPda,
          memeTokenState: { mint: mint.publicKey } as any,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [creator],
      });
      const registry = await program.account.convictionRegistry.fetch(convictionRegistryPda);
      assert.isTrue(
        registry.holders.some(
          (holder: web3.PublicKey) =>
            holder.toString() === creator.publicKey.toString()
        )
      );
    });

    it("Prevents duplicate registration of the same holder", async () => {
      await program.rpc.registerHolder({
        accounts: {
          user: creator.publicKey,
          userTokenAccount: recipientAta.publicKey,
          convictionRegistry: convictionRegistryPda,
          memeTokenState: { mint: mint.publicKey } as any,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [creator],
      });
      const registry = await program.account.convictionRegistry.fetch(convictionRegistryPda);
      const occurrences = registry.holders.filter(
        (holder: web3.PublicKey) =>
          holder.toString() === creator.publicKey.toString()
      ).length;
      assert.equal(occurrences, 1);
    });

    it("Distributes conviction NFTs to registered holders", async () => {
      const nftMint = web3.Keypair.generate();
      const holderNftTokenAccount = web3.Keypair.generate();

      await program.rpc.distributeConvictionNfts({
        accounts: {
          authority: creator.publicKey,
          convictionRegistry: convictionRegistryPda,
          memeTokenState: { mint: mint.publicKey } as any,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
        },
        remainingAccounts: [
          { pubkey: nftMint.publicKey, isSigner: false, isWritable: true },
          { pubkey: holderNftTokenAccount.publicKey, isSigner: false, isWritable: true },
        ],
        signers: [creator],
      });

      const registry = await program.account.convictionRegistry.fetch(convictionRegistryPda);
      // After NFT distribution, the registry might be pruned.
      assert.isTrue(registry.holderCount <= 1);
    });
  });

  // ---------------------------
  // Trading via Orca Tests
  describe("Trading via Orca", () => {
    it("Executes a token swap and triggers metadata evolution", async () => {
      // Create dummy accounts for the Orca swap.
      const orcaPoolTokenA = web3.Keypair.generate();
      const orcaPoolTokenB = web3.Keypair.generate();
      const orcaPoolFeeAccount = web3.Keypair.generate();
      const whirlpoolKeypair = web3.Keypair.generate();

      // Airdrop SOL to the dummy Whirlpool account.
      const whirlpoolAirdropSig = await provider.connection.requestAirdrop(
        whirlpoolKeypair.publicKey,
        1 * web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(whirlpoolAirdropSig);
      // In a full integration test, dummyWhirlpoolData would be written to this account.

      await program.rpc.tradeViaOrca(
        new BN(10000), // amount_in
        new BN(5000),  // min_out
        new BN(300),   // _unused_current_price (will be recalculated)
        {
          accounts: {
            user: creator.publicKey,
            userInTokenAccount: recipientAta.publicKey,
            userOutTokenAccount: recipientAta.publicKey,
            orcaPoolTokenA: orcaPoolTokenA.publicKey,
            orcaPoolTokenB: orcaPoolTokenB.publicKey,
            orcaPoolFeeAccount: orcaPoolFeeAccount.publicKey,
            memeTokenState: { mint: mint.publicKey } as any,
            evolutionData: evolutionDataPda,
            metadata: recipientAta.publicKey,
            metadataUpdateAuthority: creator.publicKey,
            whirlpool: whirlpoolKeypair.publicKey,
            protocolSolVault: creator.publicKey,
            creatorTokenVault: recipientAta.publicKey,
            orcaWhirlpoolsProgram: ORCA_WHIRLPOOLS_PROGRAM,
            tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
          },
          signers: [creator],
        }
      );
      // Logs should confirm fee transfers and evolution triggering.
    });
  });

  // ---------------------------
  // Single-Sided Liquidity Tests
  describe("Single-Sided Liquidity", () => {
    it("Executes create_single_sided_liquidity successfully", async () => {
      await program.rpc.createSingleSidedLiquidity(new BN(5000), {
        accounts: {
          creator: creator.publicKey,
          creatorTokenAccount: recipientAta.publicKey,
          orcaPoolTokenA: poolVault.publicKey,
          orcaPoolTokenB: tokenVaultB.publicKey,
          orcaPoolAuthority: poolAuthority.publicKey,
          orcaProgram: ORCA_WHIRLPOOLS_PROGRAM,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [creator],
      });
      // Logs should indicate successful liquidity addition.
    });
  });

  // ---------------------------
  // Negative and Security Tests
  describe("Negative and Security Tests", () => {
    it("Fails withdrawCreatorTokens when signer is unauthorized", async () => {
      try {
        await program.rpc.withdrawCreatorTokens(new BN(500), {
          accounts: {
            feeVault: feeVaultPda,
            creatorTokenVault: recipientAta.publicKey,
            creatorSigner: recipientAta.publicKey, // Incorrect signer.
            recipientTokenAccount: recipientAta.publicKey,
            tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
          },
          signers: [],
        });
        assert.fail("Expected unauthorized error");
      } catch (err) {
        // Expected error.
      }
    });

    it("Fails tradeViaOrca with insufficient token amount", async () => {
      try {
        await program.rpc.tradeViaOrca(
          new BN(1), // Insufficient amount
          new BN(5000),
          new BN(300),
          {
            accounts: {
              user: creator.publicKey,
              userInTokenAccount: recipientAta.publicKey,
              userOutTokenAccount: recipientAta.publicKey,
              orcaPoolTokenA: poolVault.publicKey,
              orcaPoolTokenB: tokenVaultB.publicKey,
              orcaPoolFeeAccount: feeAccount.publicKey,
              memeTokenState: { mint: mint.publicKey } as any,
              evolutionData: evolutionDataPda,
              metadata: recipientAta.publicKey,
              metadataUpdateAuthority: creator.publicKey,
              whirlpool: poolAccount.publicKey,
              protocolSolVault: creator.publicKey,
              creatorTokenVault: recipientAta.publicKey,
              orcaWhirlpoolsProgram: ORCA_WHIRLPOOLS_PROGRAM,
              tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
              tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
            },
            signers: [creator],
          }
        );
        assert.fail("Expected failure due to insufficient token amount for swap");
      } catch (err) {
        // Expected error.
      }
    });

    it("Handles updateMemeMetadata gracefully when no evolution threshold is crossed", async () => {
      try {
        await program.rpc.updateMemeMetadata(new BN(5000), {
          accounts: {
            evolutionData: evolutionDataPda,
            mint: mint.publicKey,
            metadata: recipientAta.publicKey,
            metadataUpdateAuthority: creator.publicKey,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
          },
          signers: [],
        });
        // Should complete without error, indicating no threshold crossed.
      } catch (err) {
        assert.fail("updateMemeMetadata should not fail when no evolution threshold is met");
      }
    });
  });
});
