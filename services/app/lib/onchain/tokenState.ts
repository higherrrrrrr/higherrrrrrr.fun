export interface TokenState {
  level: number;
  levelProgress: number;
  maxLevel: number;
  marketType: 'bonding_curve' | 'liquidity_pool';
  currentPrice: number;
  priceLevels: number[];
  liquidityScore: number;
  distributionScore: number;
}

export async function getTokenState(address: string): Promise<TokenState | null> {
  try {
    const response = await fetch(`/api/tokens/${address}/state`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Failed to fetch token state:', error);
    return null;
  }
} 