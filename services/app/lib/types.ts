export interface TokenData {
  address: string;
  symbol?: string;
  name?: string;
  creator?: string;
  createdAt: Date;
  website?: string;
  twitter?: string;
  telegram?: string;
  description?: string;
  marketData?: MarketData;
}

export interface MarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  volumeChange24h: number;
  priceChange24h: number;
  priceChange7d?: number;
  priceChange30d?: number;
  volume7d?: number;
  volume30d?: number;
  totalLiquidity: number;
  holders: number;
  supply: {
    total: string;
    circulating: string;
  };
  lastUpdated: number;
}

export interface TokenState {
  currentLevel: number;
  currentPrice: number;
  marketType: 'bonding_curve' | 'amm';
  priceLevels: {
    price: number;
    name: string;
    image?: string;
  }[];
  progress?: number;
}

export interface Token {
  address: string;
  name: string;
  symbol: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  holders: number;
  totalSupply: string;
  amount: string;
  value: number;
  lastUpdated: Date;
  priceLevels?: Array<{ price: string; name: string }>;
  currentPrice?: string;
  marketType?: 'bonding_curve' | 'amm';
  currentLevel?: number;
  image?: string;
}

export interface NFT {
  mint: string;
  name: string;
  image: string;
  collection?: string;
  lastPrice?: number;
}

export interface Transaction {
  signature: string;
  timestamp: Date;
  type: string;
  token: {
    address: string;
    symbol: string;
    amount: number;
    price?: number;
    value?: number;
  };
  status: 'confirmed' | 'pending';
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  amount: number;
  price: number;
  value: number;
  priceChange24h: number;
  lastUpdated: Date;
}

export interface Portfolio {
  tokens: TokenBalance[];
  nfts: NFT[];
  totalValue: number;
  change24h: number;
  pnl?: {
    daily: PnLData[];
    weekly: PnLData[];
    monthly: PnLData[];
  };
  transactions?: Transaction[];
}

export interface Holdings {
  [tokenAddress: string]: {
    amount: number;
    avgPrice: number;
  };
}

export interface PnLData {
  date: string;
  value: number;
  change: number;
}

export interface WebSocketPriceUpdate {
  type: 'price';
  address: string;
  price: number;
  priceChange24h: number;
  timestamp: number;
}

export interface WebSocketHolderUpdate {
  type: 'holders';
  address: string;
  holders: number;
  totalSupply: string;
  timestamp: number;
}

export type WebSocketEvent = WebSocketPriceUpdate | WebSocketHolderUpdate;

export interface HeliusToken {
  address: string;
  symbol: string;
  name: string;
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  volume1h: number;
  volume24h: number;
  volume7d: number;
  marketCap: number;
  holders: number;
  whaleScore: number;
  metadata?: {
    name: string;
    symbol: string;
    image?: string;
    description?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
  };
}

export interface HeliusAsset {
  id: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
      description?: string;
      attributes?: Array<{
        trait_type: string;
        value: string | number;
      }>;
    };
    files?: Array<{
      uri: string;
      type: string;
    }>;
  };
  ownership?: {
    holderCount: number;
    whaleCount: number;
  };
  price?: number;
  priceChange?: {
    h1: number;
    h24: number;
    d7: number;
  };
  volume?: {
    h1: number;
    h24: number;
    d7: number;
  };
  marketCap?: number;
}

export interface HeliusTransaction {
  signature: string;
  type: string;
  timestamp: number;
  slot: number;
  signer: string[];
  // Add other fields as needed
} 