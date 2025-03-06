import { NextResponse } from 'next/server';
import { query } from '@/models/db';

// WARNING: This endpoint clears all application data
// Only available in development environment
export async function POST(request) {
  // Safety check - only allow in development
  if (process.env.NODE_ENV !== 'development' && 
      process.env.NODE_ENV !== 'test') {
    console.error('Attempted to access database reset endpoint in production');
    return NextResponse.json({
      success: false,
      error: 'This endpoint is only available in development/test environments'
    }, { status: 403 });
  }
  
  try {
    await query('BEGIN');
    
    // Clear all application tables
    await query('TRUNCATE TABLE trades CASCADE');
    await query('TRUNCATE TABLE positions CASCADE');
    await query('TRUNCATE TABLE user_stats CASCADE');
    
    await query('COMMIT');
    
    console.log('Database successfully reset for testing');
    return NextResponse.json({
      success: true,
      message: 'Database cleared successfully'
    });
  } catch (error) {
    await query('ROLLBACK');
    console.error('Error clearing database:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 