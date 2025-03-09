import { NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/positions/positionService';

export async function GET(request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sort_by') || 'total_realized_pnl';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    
    // Validate limit
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 100.'
      }, { status: 400 });
    }
    
    // Get leaderboard data
    const leaderboard = await getLeaderboard(sortBy, limit);
    
    return NextResponse.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
