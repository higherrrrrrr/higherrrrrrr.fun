import { ponder } from "ponder:registry";
import { token, tokenTransfer } from "../ponder.schema";

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
    amount: event.args.amount,
    txHash: event.transaction.hash,
    blockNumber: event.block.number,
    blockTimestamp: event.block.timestamp,
    logId: event.log.id,
  });
});
