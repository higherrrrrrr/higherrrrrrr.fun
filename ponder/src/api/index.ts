import { desc, graphql, count, gte, eq } from "ponder";
import { getTableColumns } from "drizzle-orm";
import { ponder } from "ponder:registry";
import { token, tokenTransfer } from "ponder:schema";
import { isAddress } from "viem";

const takeUniqueOrThrow = <T extends any[]>(values: T): T[number] => {
  if (values.length !== 1)
    throw new Error("Found non unique or inexistent value");
  return values[0]!;
};

const blockTimestampToDate = (blockTimestamp: bigint) =>
  new Date(Number(blockTimestamp * 1_000n));

const tokenToJSON = (t: typeof token.$inferSelect) => ({
  ...t,
  blockNumber: t.blockNumber.toString(),
  blockTimestamp: blockTimestampToDate(t.blockTimestamp),
});

if (process.env.ENABLE_GRAPHQL_API === "true") {
  ponder.use("/", graphql());
  ponder.use("/graphql", graphql());
}

ponder.get("/tokens/latest", async (c) => {
  const tokens = await c.db
    .select()
    .from(token)
    .orderBy(desc(token.blockNumber))
    .limit(2000);

  return c.json(tokens.map(tokenToJSON));
});

ponder.get("/tokens/top-trading", async (c) => {
  const now = Math.floor(Date.now() / 1000);
  const twelveHoursAgo = now - 12 * 60 * 60;

  const transfers = c.db
    .select({
      tokenAddress: tokenTransfer.tokenAddress,
      transferCount: count().as("transferCount"),
    })
    .from(tokenTransfer)
    .groupBy(tokenTransfer.tokenAddress)
    .where(gte(tokenTransfer.blockTimestamp, BigInt(twelveHoursAgo)))
    .as("transfers");

  const result = await c.db
    .select({
      ...getTableColumns(token),
      transferCount: transfers.transferCount,
    })
    .from(transfers)
    .innerJoin(token, eq(transfers.tokenAddress, token.address))
    .orderBy(desc(transfers.transferCount))
    .limit(2000);

  return c.json(result.map(tokenToJSON));
});

ponder.get("/tokens/:address", async (c) => {
  const address = c.req.param("address");
  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  try {
    const result = await c.db
      .select()
      .from(token)
      .where(eq(token.address, address))
      .then(takeUniqueOrThrow);

    return c.json(tokenToJSON(result));
  } catch (_) {
    return c.json({ error: "Token not found" }, 404);
  }
});
