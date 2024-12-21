import { ponder } from "ponder:registry";
import {
  convictionNFT,
  token,
  tokenConvictionMapping,
  tokenTransfer,
  TokenType,
} from "ponder:schema";

const TOKEN_TYPE_MAP: Record<number, TokenType> = {
  0: "REGULAR",
  1: "TEXT_EVOLUTION",
  2: "IMAGE_EVOLUTION",
};

ponder.on("HigherrrrrrrFactoryV1:NewToken", async ({ event, context }) => {
  const tokenType =
    TOKEN_TYPE_MAP[event.args.tokenType as keyof typeof TOKEN_TYPE_MAP] ??
    "REGULAR";

  await context.db.insert(token).values({
    protocolVersion: "v1",
    tokenType,
    name: event.args.name,
    symbol: event.args.symbol,
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
  "HigherrrrrrrV1:HigherrrrrrMarketGraduated",
  async ({ event, context }) => {
    await context.db.update(token, { address: event.args.tokenAddress }).set({
      marketType: "UNISWAP_POOL",
      poolAddress: event.args.poolAddress,
    });
  }
);

ponder.on("HigherrrrrrrV1:Transfer", async ({ event, context }) => {
  await context.db.insert(tokenTransfer).values({
    tokenAddress: event.log.address,
    from: event.args.from,
    to: event.args.to,
    amount: event.args.amount,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    logId: event.log.id,
  });
});

ponder.on("HigherrrrrrrConvictionV1:Transfer", async ({ event, context }) => {
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
    const { HigherrrrrrrConvictionV1 } = context.contracts;

    const [name, imageURI, amount, price, timestamp] =
      await client.readContract({
        abi: HigherrrrrrrConvictionV1.abi,
        address: event.log.address,
        functionName: "convictionDetails",
        args: [event.args.id],
      });

    await context.db.insert(convictionNFT).values({
      address: event.log.address,
      id: event.args.id,
      minter: minter,
      owner: event.args.to,
      tokenAddress: higherrrrrrrToken.tokenAddress,
      metadataName: name,
      metadataAmount: amount,
      metadataPrice: price,
      metadataTimestamp: timestamp,
      metadataImageURI: imageURI,
    });
  };

  if (event.args.from === "0x0000000000000000000000000000000000000000") {
    // Mint, assign minter
    await insertNFT(event.args.to);
  } else {
    // Transfer, update owner
    try {
      await context.db
        .update(convictionNFT, {
          address: event.log.address,
          id: event.args.id,
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
