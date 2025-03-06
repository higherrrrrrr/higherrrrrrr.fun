// services/app/app/api/portfolio/route.js
import { NextResponse } from 'next/server';
import { getUserStats } from '@/lib/positions/positionService';
import { getEnhancedPortfolio } from '@/lib/positions/portfolioService';

export async function GET(request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet_address');
    
    if (!walletAddress) {
      return NextResponse.json({
        success: false,
        error: 'wallet_address parameter is required'
      }, { status: 400 });
    }
    
    // Get user's enhanced positions and stats
    const positions = await getEnhancedPortfolio(walletAddress);
    const stats = await getUserStats(walletAddress);
    
    // Calculate total portfolio value and PnL
    const totalMarketValue = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.market_value || 0), 
      0
    );
    
    const totalCostBasis = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.cost_basis || 0), 
      0
    );
    
    const totalUnrealizedPnl = positions.reduce(
      (sum, pos) => sum + parseFloat(pos.unrealized_pnl || 0), 
      0
    );
    
    const totalRealizedPnl = parseFloat(stats?.total_realized_pnl || 0);
    const totalPnl = totalUnrealizedPnl + totalRealizedPnl;
    
    // Format the response
    return NextResponse.json({
      success: true,
      portfolio: {
        positions,
        summary: {
          market_value: totalMarketValue,
          cost_basis: totalCostBasis,
          unrealized_pnl: totalUnrealizedPnl,
          realized_pnl: totalRealizedPnl,
          total_pnl: totalPnl,
          position_count: positions.length,
          total_volume: stats?.total_volume || 0,
          trade_count: stats?.trade_count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}