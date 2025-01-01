import { desc, graphql, count, gte, eq, and } from "ponder";
import { getTableColumns } from "drizzle-orm";
import { ponder } from "ponder:registry";
import { token, tokenTransfer, convictionNFT } from "ponder:schema";
import { isAddress, formatEther } from "viem";

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

const nftToJSON = (nft: typeof convictionNFT.$inferSelect) => {
  const {
    metadataName,
    metadataAmount,
    metadataPrice,
    metadataTimestamp,
    metadataImageURI,
    id,
    ...token
  } = nft;

  return {
    ...token,
    id: id.toString(),
    metadata: {
      name: metadataName,
      amount: (metadataAmount / BigInt(Math.pow(10, 18))).toString(),
      amountFull: metadataAmount.toString(),
      price: formatEther(metadataPrice),
      timestamp: blockTimestampToDate(metadataTimestamp),
      imageURI: metadataImageURI,
    },
  };
};

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

ponder.get("/tokens/:address/nfts", async (c) => {
  const address = c.req.param("address");
  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const nfts = await c.db
    .select()
    .from(convictionNFT)
    .where(eq(convictionNFT.tokenAddress, address));

  return c.json(nfts.map(nftToJSON));
});

ponder.get("/tokens/:address/nfts/:id", async (c) => {
  const address = c.req.param("address");
  const id = c.req.param("id");
  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const nft = await c.db.query.convictionNFT.findFirst({
    where: and(
      eq(convictionNFT.tokenAddress, address),
      eq(convictionNFT.id, BigInt(id))
    ),
  });

  if (!nft) {
    return c.json({ error: "NFT not found" }, 404);
  }

  return c.json(nftToJSON(nft));
});

ponder.get("/accounts/:address/nfts", async (c) => {
  const address = c.req.param("address");
  if (!isAddress(address)) {
    return c.json({ error: "Invalid address" }, 400);
  }

  const nfts = await c.db
    .select()
    .from(convictionNFT)
    .where(eq(convictionNFT.owner, address));

  return c.json(nfts.map(nftToJSON));
});
