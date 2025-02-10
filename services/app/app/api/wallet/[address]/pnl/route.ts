import { NextResponse } from 'next/server';
import { getWalletTransactions } from '@/lib/helius';

export async function GET(
  request: Request,
  context: { params: { address: string } }
) {
  try {
    const { address } = context.params;
    const transactions = await getWalletTransactions(address);
    
    const pnl = calculatePnL(transactions);
    return NextResponse.json({ data: pnl });
  } catch (error) {
    console.error('Failed to calculate PNL:', error);
    return NextResponse.json(
      { error: 'Failed to calculate PNL' },
      { status: 500 }
    );
  }
}

function calculatePnL(transactions: any[]) {
  const holdings: { [key: string]: { amount: number; avgPrice: number } } = {};
  let realizedPnL = 0;

  transactions.forEach(tx => {
    if (tx.type === 'SWAP' || tx.type === 'TRANSFER') {
      const { tokenIn, tokenOut, amountIn, amountOut } = tx.tokenTransfers[0];
      
      // Handle buy
      if (tokenIn) {
        if (!holdings[tokenIn]) {
          holdings[tokenIn] = { amount: 0, avgPrice: 0 };
        }
        const newAmount = holdings[tokenIn].amount + Number(amountIn);
        holdings[tokenIn].avgPrice = 
          (holdings[tokenIn].avgPrice * holdings[tokenIn].amount + 
           Number(amountIn) * tx.tokenPrices[tokenIn]) / newAmount;
        holdings[tokenIn].amount = newAmount;
      }

      // Handle sell
      if (tokenOut) {
        if (holdings[tokenOut]) {
          const sellPrice = tx.tokenPrices[tokenOut];
          const profit = 
            (sellPrice - holdings[tokenOut].avgPrice) * Number(amountOut);
          realizedPnL += profit;
          holdings[tokenOut].amount -= Number(amountOut);
        }
      }
    }
  });

  return {
    realized: realizedPnL,
    unrealized: calculateUnrealizedPnL(holdings),
    total: realizedPnL + calculateUnrealizedPnL(holdings)
  };
}

function calculateUnrealizedPnL(holdings: any) {
  // Calculate unrealized PNL based on current token prices
  // This would need current price data from Helius
  return 0; // Placeholder
} 