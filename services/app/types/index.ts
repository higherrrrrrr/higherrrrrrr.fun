export interface TokenData {
  mintAddress: string;
  name: string;
  symbol: string;
  totalSupply: number;
  circulatingSupply?: number;
  marketCap?: number;
  volume24h?: number;
  holdersCount?: number;
  distributionCategory?: 'excellent' | 'fair' | 'sketch';
  launchDate?: Date;
  evolutionLevel?: number;
  currentPrice?: number;
  nextEvolutionThreshold?: number;
  updatedAt: Date;
}

export interface HolderData {
  address: string;
  amount: number;
  isTreasury?: boolean;
  percentage?: number;
  lastUpdated: Date;
} 