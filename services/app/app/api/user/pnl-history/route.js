import { NextResponse } from 'next/server';
import { getHistoricalPnL } from '@/lib/positions/portfolioService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const period = searchParams.get('period') || 'month';
    
    if (!address) {
      return NextResponse.json({
        success: false,
        error: 'Wallet address is required'
      }, { status: 400 });
    }
    
    const pnlData = await getHistoricalPnL(address, period);
    
    return NextResponse.json({
      success: true,
      data: pnlData
    });
  } catch (error) {
    console.error('Error fetching PnL history:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 