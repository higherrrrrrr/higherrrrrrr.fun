import { index, onchainTable, primaryKey, relations } from "ponder";

export type TokenType = "REGULAR" | "TEXT_EVOLUTION" | "IMAGE_EVOLUTION";

export type ProtocolVersion = "v0" | "v1";

export type MarketType = "BONDING_CURVE" | "UNISWAP_POOL";

export const token = onchainTable(
  "token",
  (t) => ({
    address: t.hex().primaryKey(),
    name: t.text(),
    symbol: t.text(),
    protocolVersion: t.text().notNull().$type<ProtocolVersion>(),
    tokenType: t.text().notNull().$type<TokenType>(),
    marketType: t.text().notNull().$type<MarketType>(),
    poolAddress: t.hex(),
    convictionAddress: t.hex().notNull(),
    creatorAddress: t.hex().notNull(),
    txHash: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.bigint().notNull(),
  }),
  (table) => ({
    blockNumberIdx: index().on(table.blockNumber),
  })
);

export const tokenRelations = relations(token, ({ many }) => ({
  tokenTransfers: many(tokenTransfer),
  convictionNFTs: many(convictionNFT),
}));

export const tokenTransfer = onchainTable(
  "token_transfer",
  (t) => ({
    tokenAddress: t.hex().notNull(),
    from: t.hex().notNull(),
    to: t.hex().notNull(),
    amount: t.bigint().notNull(),
    txHash: t.hex().notNull(),
    blockNumber: t.bigint().notNull(),
    blockTimestamp: t.bigint().notNull(),
    logId: t.text().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.txHash, table.logId],
    }),
    tokenAddressIdx: index().on(table.tokenAddress),
    blockTimestampIdx: index().on(table.blockTimestamp),
  })
);

export const tokenTransferRelations = relations(tokenTransfer, ({ one }) => ({
  token: one(token, {
    fields: [tokenTransfer.tokenAddress],
    references: [token.address],
  }),
}));

export const convictionNFT = onchainTable(
  "conviction_nft",
  (t) => ({
    address: t.hex().notNull(),
    tokenAddress: t.hex().notNull(),
    id: t.bigint().notNull(),
    minter: t.hex(),
    owner: t.hex().notNull(),

    metadataName: t.text().notNull(),
    metadataAmount: t.bigint().notNull(),
    metadataPrice: t.bigint().notNull(),
    metadataTimestamp: t.bigint().notNull(),
    metadataImageURI: t.text(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.address, table.id],
    }),
    ownerIdx: index().on(table.owner),
    tokenAddressIdx: index().on(table.tokenAddress),
  })
);

export const convictionNFTRelations = relations(convictionNFT, ({ one }) => ({
  token: one(token, {
    fields: [convictionNFT.tokenAddress],
    references: [token.address],
  }),
}));

// Mapping table between convictionAddress -> tokenAddress, only used for internal
// lookups during indexing
export const tokenConvictionMapping = onchainTable(
  "token_conviction_mapping",
  (t) => ({
    tokenAddress: t.hex().notNull(),
    convictionAddress: t.hex().notNull().primaryKey(),
  })
);
