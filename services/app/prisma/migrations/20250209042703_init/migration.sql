-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT,
    "symbol" TEXT,
    "decimals" INTEGER NOT NULL DEFAULT 9,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenMarketData" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priceChange24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volumeChange24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalLiquidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "holderCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenMarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenDistribution" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 100,
    "warning" BOOLEAN NOT NULL DEFAULT false,
    "largestHolder" TEXT NOT NULL DEFAULT '0',
    "top5Holders" TEXT NOT NULL DEFAULT '0',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenDistribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistoryPoint" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "volume" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "marketCap" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "PriceHistoryPoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPool" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "dex" TEXT NOT NULL,
    "liquidity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "volume24h" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "apr" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityPool_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Token_address_key" ON "Token"("address");

-- CreateIndex
CREATE INDEX "Token_symbol_idx" ON "Token"("symbol");

-- CreateIndex
CREATE INDEX "Token_createdAt_idx" ON "Token"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TokenMarketData_tokenAddress_key" ON "TokenMarketData"("tokenAddress");

-- CreateIndex
CREATE INDEX "TokenMarketData_updatedAt_idx" ON "TokenMarketData"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TokenDistribution_tokenAddress_key" ON "TokenDistribution"("tokenAddress");

-- CreateIndex
CREATE INDEX "TokenDistribution_score_idx" ON "TokenDistribution"("score");

-- CreateIndex
CREATE INDEX "PriceHistoryPoint_timestamp_idx" ON "PriceHistoryPoint"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "PriceHistoryPoint_tokenAddress_timestamp_key" ON "PriceHistoryPoint"("tokenAddress", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_address_key" ON "LiquidityPool"("address");

-- CreateIndex
CREATE INDEX "LiquidityPool_dex_idx" ON "LiquidityPool"("dex");

-- CreateIndex
CREATE INDEX "LiquidityPool_updatedAt_idx" ON "LiquidityPool"("updatedAt");

-- AddForeignKey
ALTER TABLE "TokenMarketData" ADD CONSTRAINT "TokenMarketData_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TokenDistribution" ADD CONSTRAINT "TokenDistribution_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistoryPoint" ADD CONSTRAINT "PriceHistoryPoint_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityPool" ADD CONSTRAINT "LiquidityPool_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
