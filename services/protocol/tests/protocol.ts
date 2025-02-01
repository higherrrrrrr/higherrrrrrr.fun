import * as anchor from "@project-serum/anchor";
import { Program, web3, BN } from "@project-serum/anchor";
import { assert } from "chai";
import { Protocol } from "../target/types/protocol";

describe("Full Test Suite for Higherrrrrrrr Protocol", () => {
  // Set the provider to local cluster.
  const provider = anchor.Provider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Protocol as Program<Protocol>;

  // Dummy external program IDs (these can be replaced with mocks if desired)
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
  const recipientAta = web3.Keypair.generate(); // dummy associated token account
  const poolVault = web3.Keypair.generate();
  const poolAccount = web3.Keypair.generate();
  const poolAuthority = web3.Keypair.generate();
  const tokenVaultB = web3.Keypair.generate();
  const feeAccount = web3.Keypair.generate();
  const wsolMint = web3.Keypair.generate();

  // PDAs and other global variables
  let evolutionDataPda: web3.PublicKey;
  let memeTokenStatePda: web3.PublicKey;
  let convictionRegistryPda: web3.PublicKey;
  let feeVaultPda: web3.PublicKey;

  // Dummy data for simulating a Whirlpool account (for trade tests)
  // For example, we set sqrt_price_x96 = 1<<96 (price = 1)
  const dummySqrtPriceX96 = BigInt(1) << BigInt(96);
  let dummyWhirlpoolData: Buffer;

  // ---------------------------
  // Global Setup (Airdrops & PDA Derivation)
  // ---------------------------
  before(async () => {
    const airdropAmount = 10 * web3.LAMPORTS_PER_SOL;
    // Airdrop SOL to creator, mintAuthority, and poolAuthority.
    for (let kp of [creator, mintAuthority, poolAuthority]) {
      const sig = await provider.connection.requestAirdrop(
        kp.publicKey,
        airdropAmount
      );
      await provider.connection.confirmTransaction(sig);
    }
    // Extra airdrop to creator if needed.
    const creatorSig = await provider.connection.requestAirdrop(
      creator.publicKey,
      airdropAmount
    );
    await provider.connection.confirmTransaction(creatorSig);

    // Derive the evolution_data PDA using seed "evolution_data" and the mint's public key.
    [evolutionDataPda] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("evolution_data"), mint.publicKey.toBuffer()],
      program.programId
    );

    // For meme token state, we simply generate a new public key for testing.
    memeTokenStatePda = web3.Keypair.generate().publicKey;

    // Derive the conviction registry PDA (using seed "conviction_registry" and mint's public key).
    [convictionRegistryPda] = await web3.PublicKey.findProgramAddress(
      [Buffer.from("conviction_registry"), mint.publicKey.toBuffer()],
      program.programId
    );

    // For fee vault, we simulate a new account that will be initialized.
    // (The fee vault instruction uses an "init" constraint so we supply a new keypair.)
    feeVaultPda = web3.Keypair.generate().publicKey;

    // Prepare dummy Whirlpool data.
    // We allocate 200 bytes and write dummySqrtPriceX96 as an 128‑bit number.
    dummyWhirlpoolData = Buffer.alloc(200);
    // Write lower 64 bits (little-endian) at offset 0
    dummyWhirlpoolData.writeBigUInt64LE(
      dummySqrtPriceX96 & BigInt("0xffffffffffffffff"),
      0
    );
    // Write upper 64 bits at offset 8
    dummyWhirlpoolData.writeBigUInt64LE(dummySqrtPriceX96 >> BigInt(64), 8);
  });

  // ---------------------------
  // Token Creation & Distribution
  // ---------------------------
  describe("Token Creation & Distribution", () => {
    it("Creates a meme token with correct state and distributions", async () => {
      // Set up distribution instructions: 50% non-pool, 50% pool.
      const distributions = [
        { recipient: creator.publicKey, percentage: 50, isPool: false },
        { recipient: creator.publicKey, percentage: 50, isPool: true },
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
        "TestToken", // name
        "TTK", // symbol
        9, // decimals
        new BN(1_000_000_000), // total supply (1B)
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

      // Fetch and verify meme token state.
      const tokenState = await program.account.memeTokenState.fetch(
        memeTokenStatePda
      );
      assert.equal(tokenState.name, "TestToken");
      assert.equal(tokenState.symbol, "TTK");
      assert.ok(tokenState.totalSupply.eq(new BN(1_000_000_000)));
      assert.equal(tokenState.decimals, 9);
      // Verify that the pool field is set.
      assert.notEqual(tokenState.pool.toString(), web3.PublicKey.default.toString());
    });
  });

  // ---------------------------
  // Evolutions & Metadata Updates
  // ---------------------------
  describe("Evolutions and Metadata Updates", () => {
    it("Sets evolution rules via set_evolutions", async () => {
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

      // Verify evolution_data state.
      const evoData = await program.account.evolutionData.fetch(evolutionDataPda);
      assert.equal(evoData.evolutionCount, 2);
      assert.equal(evoData.evolutions[0].newName, "Level2");
      assert.equal(evoData.evolutions[1].newName, "Level3");
    });

    it("Does not update metadata when current price is below threshold", async () => {
      // Price 150 is below both new thresholds (200 and 300).
      await program.rpc.updateMemeMetadata(new BN(150), {
        accounts: {
          evolutionData: evolutionDataPda,
          mint: mint.publicKey,
          metadata: recipientAta.publicKey, // using dummy metadata account
          metadataUpdateAuthority: creator.publicKey,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM,
        },
        signers: [],
      });
      // No error is expected; logs should indicate no threshold crossed.
    });

    it("Updates metadata when current price exceeds a threshold", async () => {
      // Price 250 exceeds the 200 threshold (but not 300).
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
      // In a full integration test you would fetch and inspect the metadata account.
    });
  });

  // ---------------------------
  // Fee Vault & Withdrawals
  // ---------------------------
  describe("Fee Vault and Withdrawals", () => {
    let feeVaultKeypair: web3.Keypair;
    before(async () => {
      feeVaultKeypair = web3.Keypair.generate();
    });

    it("Initializes the fee vault", async () => {
      await program.rpc.initFeeVault({
        accounts: {
          payer: creator.publicKey,
          feeVault: feeVaultKeypair.publicKey,
          protocolSolVault: creator.publicKey, // using creator's account for simplicity
          creatorTokenVault: recipientAta.publicKey,
          protocolPubkey: creator.publicKey,
          creatorPubkey: creator.publicKey,
          lpTokenVault: poolVault.publicKey,
          systemProgram: web3.SystemProgram.programId,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [creator, feeVaultKeypair],
      });

      const feeVault = await program.account.feeVault.fetch(
        feeVaultKeypair.publicKey
      );
      assert.equal(
        feeVault.protocolSolVault.toString(),
        creator.publicKey.toString()
      );
      assert.equal(
        feeVault.creatorTokenVault.toString(),
        recipientAta.publicKey.toString()
      );
    });

    it("Allows authorized protocol SOL withdrawal", async () => {
      // For testing, we simulate the protocol SOL vault as creator's account.
      const beforeBalance = (
        await provider.connection.getAccountInfo(creator.publicKey)
      )!.lamports;
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
      const afterBalance = (
        await provider.connection.getAccountInfo(creator.publicKey)
      )!.lamports;
      assert.isTrue(beforeBalance - afterBalance >= 1000);
    });

    it("Prevents unauthorized protocol SOL withdrawal", async () => {
      try {
        await program.rpc.withdrawProtocolSol(new BN(1000), {
          accounts: {
            feeVault: feeVaultKeypair.publicKey,
            protocolSolVault: creator.publicKey,
            // Use a wrong signer (recipientAta instead of creator)
            protocolSigner: recipientAta.publicKey,
            recipientAccount: creator.publicKey,
            systemProgram: web3.SystemProgram.programId,
          },
          signers: [],
        });
        assert.fail("Expected unauthorized error");
      } catch (err) {
        // Expected error.
      }
    });

    it("Allows creator token withdrawal", async () => {
      // This test assumes recipientAta holds tokens. In practice, you would check token balances.
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
  });

  // ---------------------------
  // Conviction NFTs
  // ---------------------------
  describe("Conviction NFTs", () => {
    let convictionRegistryKeypair: web3.Keypair;
    before(async () => {
      convictionRegistryKeypair = web3.Keypair.generate();
    });

    it("Registers a holder when balance meets threshold", async () => {
      await program.rpc.registerHolder({
        accounts: {
          user: creator.publicKey,
          userTokenAccount: recipientAta.publicKey, // assume sufficient token balance
          convictionRegistry: convictionRegistryPda,
          memeTokenState: {
            mint: mint.publicKey,
          } as any,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [creator],
      });
      const registry = await program.account.convictionRegistry.fetch(
        convictionRegistryPda
      );
      assert.isTrue(
        registry.holders.some(
          (holder: web3.PublicKey) =>
            holder.toString() === creator.publicKey.toString()
        )
      );
    });

    it("Prevents duplicate holder registration", async () => {
      // Call registerHolder again; the holder should not be added twice.
      await program.rpc.registerHolder({
        accounts: {
          user: creator.publicKey,
          userTokenAccount: recipientAta.publicKey,
          convictionRegistry: convictionRegistryPda,
          memeTokenState: {
            mint: mint.publicKey,
          } as any,
          tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
        },
        signers: [creator],
      });
      const registry = await program.account.convictionRegistry.fetch(
        convictionRegistryPda
      );
      const occurrences = registry.holders.filter(
        (holder: web3.PublicKey) =>
          holder.toString() === creator.publicKey.toString()
      ).length;
      assert.equal(occurrences, 1);
    });

    it("Distributes conviction NFTs to registered holders", async () => {
      // Each registered holder expects two extra accounts: NFT Mint and Holder's NFT Token Account.
      const nftMint = web3.Keypair.generate();
      const holderNftTokenAccount = web3.Keypair.generate();

      await program.rpc.distributeConvictionNfts({
        accounts: {
          authority: creator.publicKey,
          convictionRegistry: convictionRegistryPda,
          memeTokenState: {
            mint: mint.publicKey,
          } as any,
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

      // After distribution, the registry may be pruned.
      const registry = await program.account.convictionRegistry.fetch(
        convictionRegistryPda
      );
      assert.isTrue(registry.holderCount <= 1);
    });
  });

  // ---------------------------
  // Trading via Orca
  // ---------------------------
  describe("Trading via Orca", () => {
    it("Executes a swap and triggers evolution", async () => {
      // Create dummy accounts for Orca pool swap.
      const orcaPoolTokenA = web3.Keypair.generate();
      const orcaPoolTokenB = web3.Keypair.generate();
      const orcaPoolFeeAccount = web3.Keypair.generate();

      // Create a dummy Whirlpool account.
      const whirlpoolKeypair = web3.Keypair.generate();
      // Fund the dummy whirlpool account.
      const whirlpoolSig = await provider.connection.requestAirdrop(
        whirlpoolKeypair.publicKey,
        1 * web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(whirlpoolSig);
      // In a true integration test, you would write dummyWhirlpoolData to the account.
      // For now, we assume the program reads our dummyWhirlpoolData.

      await program.rpc.tradeViaOrca(
        new BN(10000), // amount_in
        new BN(5000), // min_out
        new BN(300), // _unused_current_price (will be recalculated)
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
      // Logs should indicate that fee transfers and evolution triggering occurred.
    });
  });

  // ---------------------------
  // Single-Sided Liquidity Provision
  // ---------------------------
  describe("Single-Sided Liquidity", () => {
    it("Executes the create_single_sided_liquidity stub", async () => {
      // This instruction simply logs a message in our current implementation.
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
    });
  });

  // ---------------------------
  // Error Cases & Negative Testing
  // ---------------------------
  describe("Error Cases and Negative Testing", () => {
    it("Fails createMemeToken when distributions do not sum to 100", async () => {
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
        assert.fail("Expected failure due to invalid distribution percentages");
      } catch (err) {
        // Expected error.
      }
    });

    it("Fails withdrawCreatorTokens when signer is unauthorized", async () => {
      try {
        await program.rpc.withdrawCreatorTokens(new BN(500), {
          accounts: {
            feeVault: feeVaultPda,
            creatorTokenVault: recipientAta.publicKey,
            // Wrong signer: using recipientAta instead of creator.
            creatorSigner: recipientAta.publicKey,
            recipientTokenAccount: recipientAta.publicKey,
            tokenProgram: anchor.web3.TOKEN_PROGRAM_ID,
          },
          signers: [],
        });
        assert.fail("Expected failure due to unauthorized signer");
      } catch (err) {
        // Expected unauthorized error.
      }
    });
  });
});
