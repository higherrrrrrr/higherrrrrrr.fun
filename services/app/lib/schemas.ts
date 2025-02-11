import { z } from 'zod';

export const TransactionSchema = z.object({
  transactions: z.array(z.object({
    id: z.string(),
    timestamp: z.number(),
    type: z.enum(['buy', 'sell']),
    token: z.object({
      address: z.string(),
      symbol: z.string(),
      name: z.string(),
      marketData: z.object({
        price: z.number(),
        priceChange24h: z.number()
      }).nullable()
    }),
    amount: z.number(),
    price: z.number(),
    value: z.number(),
    fromAddress: z.string(),
    toAddress: z.string(),
    signature: z.string()
  })),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean()
});

export const PortfolioSchema = z.object({
  tokens: z.array(z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    amount: z.number(),
    price: z.number(),
    value: z.number(),
    priceChange24h: z.number(),
    lastUpdated: z.date()
  })),
  totalValue: z.number(),
  change24h: z.number(),
  lastUpdated: z.number()
});

export const TokenListSchema = z.object({
  tokens: z.array(z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    price: z.number(),
    priceChange24h: z.number(),
    volume24h: z.number(),
    marketCap: z.number(),
    lastUpdated: z.date()
  })),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean()
});

export const TopTradingSchema = z.object({
  tokens: z.array(z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    price: z.number(),
    priceChange24h: z.number(),
    volume24h: z.number(),
    marketCap: z.number(),
    lastUpdated: z.date()
  })),
  updatedAt: z.number()
});

export const TokenSearchSchema = z.object({
  tokens: z.array(z.object({
    address: z.string(),
    symbol: z.string(),
    name: z.string(),
    decimals: z.number(),
    price: z.number(),
    priceChange24h: z.number(),
    volume24h: z.number(),
    marketCap: z.number(),
    lastUpdated: z.date()
  })),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
  query: z.string()
});

export const PriceHistorySchema = z.object({
  timestamps: z.array(z.number()),
  prices: z.array(z.number()),
  volumes: z.array(z.number()),
  marketCaps: z.array(z.number().nullable()),
  stats: z.object({
    minPrice: z.number(),
    maxPrice: z.number(),
    avgPrice: z.number(),
    totalVolume: z.number(),
    priceChange: z.number(),
    priceChangePercent: z.number()
  })
});

export const MarketDataSchema = z.object({
  price: z.number(),
  confidence: z.number(),
  marketCap: z.number(),
  volume24h: z.number(),
  volumeChange24h: z.number(),
  priceChange24h: z.number(),
  priceChange7d: z.number(),
  priceChange30d: z.number(),
  volume7d: z.number(),
  volume30d: z.number(),
  totalLiquidity: z.number(),
  holders: z.number(),
  supply: z.object({
    total: z.string(),
    circulating: z.string()
  }),
  lastUpdated: z.string(),
  source: z.string(),
  quality: z.number()
});

export const TokenBalanceSchema = z.object({
  address: z.string(),
  symbol: z.string(),
  name: z.string(),
  amount: z.string(),
  price: z.string(),
  valueUsd: z.string(),
  decimals: z.number(),
  dataSource: z.string(),
  lastUpdated: z.string()
});

export const PricePointSchema = z.object({
  timestamp: z.number(),
  price: z.number(),
  volume: z.number().nullable(),
  marketCap: z.number().nullable()
});

export const HoldersSchema = z.object({
  total: z.number(),
  price: z.number(),
  totalSupply: z.string(),
  decimals: z.number(),
  stats: z.object({
    uniqueHolders: z.number(),
    averageBalance: z.number(),
    totalValue: z.number()
  }),
  holders: z.array(z.object({
    address: z.string(),
    amount: z.string(),
    valueUsd: z.string(),
    percentage: z.string()
  })),
  lastUpdated: z.string()
}); 