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