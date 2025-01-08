import { ponder } from "ponder:registry";
import {
  token,
  tokenTransfer,
  convictionNFT,
  tokenConvictionMapping,
} from "ponder:schema";

ponder.on("HigherrrrrrrFactoryV0:NewToken", async ({ event, context }) => {
  const { client } = context;
  const { HigherrrrrrrV0 } = context.contracts;

  const [{ result: name }, { result: symbol }] = await client.multicall({
    contracts: [
      {
        abi: HigherrrrrrrV0.abi,
        address: event.args.token,
        functionName: "name",
      },
      {
        abi: HigherrrrrrrV0.abi,
        address: event.args.token,
        functionName: "symbol",
      },
    ],
  });

  await context.db.insert(token).values({
    protocolVersion: "v0",
    tokenType: "TEXT_EVOLUTION",
    name,
    symbol,
    marketType: "BONDING_CURVE",
    address: event.args.token,
    convictionAddress: event.args.conviction,
    creatorAddress: event.transaction.from,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
  });

  await context.db.insert(tokenConvictionMapping).values({
    tokenAddress: event.args.token,
    convictionAddress: event.args.conviction,
  });
});

ponder.on(
  "HigherrrrrrrV0:HigherrrrrrMarketGraduated",
  async ({ event, context }) => {
    await context.db.update(token, { address: event.args.tokenAddress }).set({
      marketType: "UNISWAP_POOL",
      poolAddress: event.args.poolAddress,
    });
  }
);

ponder.on("HigherrrrrrrV0:Transfer", async ({ event, context }) => {
  await context.db.insert(tokenTransfer).values({
    tokenAddress: event.log.address,
    from: event.args.from,
    to: event.args.to,
    amount: event.args.value,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    logId: event.log.id,
  });
});

ponder.on("HigherrrrrrrConvictionV0:Transfer", async ({ event, context }) => {
  const higherrrrrrrToken = await context.db.find(tokenConvictionMapping, {
    convictionAddress: event.log.address,
  });

  if (!higherrrrrrrToken) {
    console.warn(
      `Token for conviction NFT with address ${event.log.address} not found`
    );
    return;
  }

  const insertNFT = async (minter?: `0x${string}`) => {
    const { client } = context;
    const { HigherrrrrrrConvictionV0 } = context.contracts;

    const [name, amount, price, timestamp] = await client.readContract({
      abi: HigherrrrrrrConvictionV0.abi,
      address: event.log.address,
      functionName: "convictionDetails",
      args: [event.args.tokenId],
    });

    await context.db.insert(convictionNFT).values({
      address: event.log.address,
      id: event.args.tokenId,
      minter: minter,
      owner: event.args.to,
      tokenAddress: higherrrrrrrToken.tokenAddress,
      metadataName: name,
      metadataAmount: amount,
      metadataPrice: price,
      metadataTimestamp: timestamp,
    });
  };

  if (event.args.from === "0x0000000000000000000000000000000000000000") {
    // Mint, create and assign minter
    await insertNFT(event.args.to);
  } else {
    // Transfer, update owner
    try {
      await context.db
        .update(convictionNFT, {
          address: event.log.address,
          id: event.args.tokenId,
        })
        .set({
          owner: event.args.to,
        });
    } catch (_) {
      console.warn("Failed to update existing conviction NFT");
      // Note: If the token isn't found it means that we aren't indexing the full history so we've
      // missed the mint event. We create it again but we can't assign the minter in this case
      await insertNFT(undefined);
    }
  }
});
