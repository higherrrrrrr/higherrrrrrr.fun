export interface TokenMetadata {
  name: string;
  symbol: string;
  address: string;
  decimals: number;
  supply: {
    total: string;
    circulating: string;
  };
}

export interface TokenMarketData {
  price: number;
  priceChange24h: number;
  volume24h: number;
  volumeChange24h: number;
  marketCap: number;
  totalLiquidity: number;
}

export interface TokenHolder {
  address: string;
  balance: string;
  percentage: number;
}

export interface HolderDistribution {
  score: number;
  warning: boolean;
  details: {
    largestHolder: string;
    top5Holders: string;
  };
}

export interface LiquidityPool {
  address: string;
  dex: string;
  liquidity: number;
  volume24h: number;
  apr: number;
}

export interface PriceLevel {
  price: number;
  name: string;
  image?: string;
}

export interface Token extends TokenMetadata {
  marketData?: TokenMarketData;
  holders?: number;
  distributionScore?: number;
  holderWarning?: boolean;
  holderDetails?: {
    largestHolder: string;
    top5Holders: string;
  };
  liquidityPools?: LiquidityPool[];
  createdAt?: number;
  updatedAt?: number;
  priceLevels?: PriceLevel[];
  currentLevel?: number;
  progress?: number;
} 