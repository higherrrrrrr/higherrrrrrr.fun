export interface Token {
  id: string;
  address: string;
  symbol: string;
  name: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  holders?: number;
  totalSupply?: string;
  marketType?: string;
  marketData?: MarketData[];
}

export interface MarketData {
  price: number;
  marketCap: number;
  volume24h: number;
  volumeChange24h: number;
  priceChange24h: number;
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
  marketType: string;
  priceLevels: Array<{
    price: number;
    name: string;
    image?: string;
  }>;
  progress: number;
}

export interface Portfolio {
  tokens: Array<{
    address: string;
    symbol: string;
    name: string;
    amount: string;
    price: number;
    value: number;
    priceChange24h: number;
  }>;
  totalValue: number;
  change24h: number;
}

export interface PnLData {
  dates: string[];
  realizedPnL: number[];
  unrealizedPnL: number[];
}

export interface ApiErrorResponse {
  error: string;
  status?: number;
} 