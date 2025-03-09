import { NextResponse } from 'next/server';
import { getHistoricalPnL } from '@/lib/positions/portfolioService';

export async function GET(request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    const period = searchParams.get('period') || 'month'; // day, week, month, year, all
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'wallet_address parameter is required'
      }, { status: 400 });
    }
    
    // Use the improved getHistoricalPnL function from portfolioService
    const pnlHistoryData = await getHistoricalPnL(walletAddress, period);
    
    // For backward compatibility, transform the data to match the old format
    const pnlHistory = pnlHistoryData.map(point => ({
      date: point.timestamp,
      daily_pnl: point.realized_pnl,
      cumulative_pnl: point.cumulative_pnl,
      trade_count: 1,  // Individual trade points
      volume: 0        // Not tracked at this granularity
    }));
    
    console.log('PnL History data:', {
      walletAddress,
      period,
      dataPoints: pnlHistory.length,
      sampleData: pnlHistory.slice(0, 2)
    });
    
    return NextResponse.json({
      success: true,
      pnl_history: pnlHistory
    });
  } catch (error) {
    console.error('Error fetching PnL history:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 