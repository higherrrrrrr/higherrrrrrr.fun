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
