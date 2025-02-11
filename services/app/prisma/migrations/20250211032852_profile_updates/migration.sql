/*
  Warnings:

  - You are about to drop the column `apr` on the `LiquidityPool` table. All the data in the column will be lost.
  - You are about to drop the column `dex` on the `LiquidityPool` table. All the data in the column will be lost.
  - You are about to drop the column `volume24h` on the `LiquidityPool` table. All the data in the column will be lost.
  - You are about to drop the column `largestHolder` on the `TokenDistribution` table. All the data in the column will be lost.
  - You are about to drop the column `score` on the `TokenDistribution` table. All the data in the column will be lost.
  - You are about to drop the column `top5Holders` on the `TokenDistribution` table. All the data in the column will be lost.
  - You are about to drop the column `warning` on the `TokenDistribution` table. All the data in the column will be lost.
  - You are about to drop the `TokenMarketData` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[tokenAddress,exchange]` on the table `LiquidityPool` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `exchange` to the `LiquidityPool` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `Token` required. This step will fail if there are existing NULL values in that column.
  - Made the column `symbol` on table `Token` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `distribution` to the `TokenDistribution` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TokenMarketData" DROP CONSTRAINT "TokenMarketData_tokenAddress_fkey";

-- DropIndex
DROP INDEX "LiquidityPool_address_key";

-- DropIndex
DROP INDEX "LiquidityPool_dex_idx";

-- DropIndex
DROP INDEX "LiquidityPool_updatedAt_idx";

-- DropIndex
DROP INDEX "PriceHistoryPoint_tokenAddress_timestamp_key";

-- DropIndex
DROP INDEX "Token_createdAt_idx";

-- DropIndex
DROP INDEX "TokenDistribution_score_idx";

-- AlterTable
ALTER TABLE "LiquidityPool" DROP COLUMN "apr",
DROP COLUMN "dex",
DROP COLUMN "volume24h",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "exchange" TEXT NOT NULL,
ALTER COLUMN "liquidity" DROP DEFAULT;

-- AlterTable
ALTER TABLE "PriceHistoryPoint" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "interval" TEXT NOT NULL DEFAULT '1d',
ALTER COLUMN "volume" DROP NOT NULL,
ALTER COLUMN "volume" DROP DEFAULT,
ALTER COLUMN "marketCap" DROP NOT NULL,
ALTER COLUMN "marketCap" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Token" ADD COLUMN     "holders" INTEGER,
ADD COLUMN     "marketType" TEXT,
ADD COLUMN     "price" DOUBLE PRECISION,
ADD COLUMN     "priceChange24h" DOUBLE PRECISION,
ADD COLUMN     "totalSupply" TEXT,
ADD COLUMN     "volume24h" DOUBLE PRECISION,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "symbol" SET NOT NULL;

-- AlterTable
ALTER TABLE "TokenDistribution" DROP COLUMN "largestHolder",
DROP COLUMN "score",
DROP COLUMN "top5Holders",
DROP COLUMN "warning",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "distribution" JSONB NOT NULL;

-- DropTable
DROP TABLE "TokenMarketData";

-- CreateTable
CREATE TABLE "TokenBalance" (
    "id" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TokenBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tweet" (
    "id" TEXT NOT NULL,
    "tweetId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "in_reply_to" TEXT,

    CONSTRAINT "Tweet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketData" (
    "id" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "price" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION DEFAULT 1,
    "marketCap" DOUBLE PRECISION,
    "volume24h" DOUBLE PRECISION,
    "volumeChange24h" DOUBLE PRECISION,
    "priceChange24h" DOUBLE PRECISION,
    "priceChange7d" DOUBLE PRECISION,
    "priceChange30d" DOUBLE PRECISION,
    "volume7d" DOUBLE PRECISION,
    "volume30d" DOUBLE PRECISION,
    "totalLiquidity" DOUBLE PRECISION,
    "holders" INTEGER,
    "totalSupply" TEXT,
    "circulatingSupply" TEXT,
    "quality" DOUBLE PRECISION DEFAULT 1,
    "source" TEXT,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MarketData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "tx_signature" TEXT NOT NULL,
    "tokenAddress" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TokenBalance_walletAddress_tokenAddress_key" ON "TokenBalance"("walletAddress", "tokenAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Tweet_tweetId_key" ON "Tweet"("tweetId");

-- CreateIndex
CREATE UNIQUE INDEX "MarketData_tokenAddress_key" ON "MarketData"("tokenAddress");

-- CreateIndex
CREATE INDEX "MarketData_lastUpdated_idx" ON "MarketData"("lastUpdated");

-- CreateIndex
CREATE INDEX "MarketData_price_idx" ON "MarketData"("price");

-- CreateIndex
CREATE INDEX "MarketData_volume24h_idx" ON "MarketData"("volume24h");

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_tx_signature_key" ON "Transaction"("tx_signature");

-- CreateIndex
CREATE INDEX "Transaction_fromAddress_idx" ON "Transaction"("fromAddress");

-- CreateIndex
CREATE INDEX "Transaction_toAddress_idx" ON "Transaction"("toAddress");

-- CreateIndex
CREATE INDEX "Transaction_timestamp_idx" ON "Transaction"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPool_tokenAddress_exchange_key" ON "LiquidityPool"("tokenAddress", "exchange");

-- CreateIndex
CREATE INDEX "PriceHistoryPoint_tokenAddress_timestamp_idx" ON "PriceHistoryPoint"("tokenAddress", "timestamp");

-- CreateIndex
CREATE INDEX "PriceHistoryPoint_interval_idx" ON "PriceHistoryPoint"("interval");

-- CreateIndex
CREATE INDEX "Token_name_idx" ON "Token"("name");

-- CreateIndex
CREATE INDEX "Token_price_idx" ON "Token"("price");

-- CreateIndex
CREATE INDEX "Token_volume24h_idx" ON "Token"("volume24h");

-- AddForeignKey
ALTER TABLE "TokenBalance" ADD CONSTRAINT "TokenBalance_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tweet" ADD CONSTRAINT "Tweet_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketData" ADD CONSTRAINT "MarketData_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_tokenAddress_fkey" FOREIGN KEY ("tokenAddress") REFERENCES "Token"("address") ON DELETE RESTRICT ON UPDATE CASCADE;
