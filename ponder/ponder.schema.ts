import { index, onchainTable, primaryKey, relations } from "ponder";

type TokenType = "REGULAR" | "TEXT_EVOLUTION" | "IMAGE_EVOLUTION";

type ProtocolVersion = "v0" | "v1";

export const token = onchainTable(
  "token",
  (t) => ({
    address: t.hex().primaryKey(),
    name: t.text(),
    symbol: t.text(),
    protocolVersion: t.text().notNull().$type<ProtocolVersion>(),
    tokenType: t.text().notNull().$type<TokenType>(),
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
