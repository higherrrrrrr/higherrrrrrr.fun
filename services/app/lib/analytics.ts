import type { TokenBalance } from '@/lib/types';

interface PnLDataPoint {
  date: string;
  value: number;
  change: number;
}

export async function getPnLData(address: string, tokens: TokenBalance[]) {
  try {
    // Calculate daily PnL
    const daily = calculatePnL(tokens, 'daily');
    const weekly = calculatePnL(tokens, 'weekly');
    const monthly = calculatePnL(tokens, 'monthly');

    return {
      daily,
      weekly,
      monthly
    };
  } catch (error) {
    console.error('Failed to calculate PnL:', error);
    return {
      daily: [],
      weekly: [],
      monthly: []
    };
  }
}

function calculatePnL(
  tokens: TokenBalance[], 
  timeframe: 'daily' | 'weekly' | 'monthly'
): PnLDataPoint[] {
  const now = new Date();
  const points: PnLDataPoint[] = [];
  
  // Determine number of data points based on timeframe
  const numPoints = timeframe === 'daily' ? 7 : timeframe === 'weekly' ? 4 : 12;
  const intervalHours = timeframe === 'daily' ? 24 : timeframe === 'weekly' ? 168 : 720;

  let prevValue = 0;
  for (let i = numPoints - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - (i * intervalHours * 60 * 60 * 1000));
    
    // Calculate portfolio value at this point in time
    const value = tokens.reduce((sum, token) => {
      // Use exponential decay for price estimation
      const timeFactor = i / numPoints;
      const historicalPrice = token.price / Math.exp(token.priceChange24h * timeFactor);
      return sum + (token.amount * historicalPrice);
    }, 0);

    // Calculate change from previous point
    const change = prevValue === 0 ? 0 : ((value - prevValue) / prevValue) * 100;
    prevValue = value;

    points.push({
      date: date.toISOString().split('T')[0],
      value: Math.max(0, value), // Ensure no negative values
      change: Number(change.toFixed(2)) // Round to 2 decimal places
    });
  }

  return points;
} 