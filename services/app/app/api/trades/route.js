import { NextResponse } from 'next/server';
import { query } from '@/models/db';

/**
 * GET handler for trades API endpoint
 * Supports pagination and wallet filtering
 */
export async function GET(request) {
  try {
    // Get URL parameters
    const { searchParams } = new URL(request.url);
    
    // Extract pagination parameters with defaults
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    
    // Extract filter parameters
    const walletAddress = searchParams.get('wallet_address');
    
    // Validate pagination parameters
    if (isNaN(limit) || limit <= 0 || limit > 100) {
      return NextResponse.json({
        success: false,
        error: 'Invalid limit parameter. Must be between 1 and 100.'
      }, { status: 400 });
    }
    
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid offset parameter. Must be a non-negative integer.'
      }, { status: 400 });
    }
    
    // Base query
    let sql = 'SELECT * FROM trades';
    const params = [];
    
    // Add wallet filter if provided
    if (walletAddress) {
      sql += ' WHERE wallet_address = $1';
      params.push(walletAddress);
    }
    
    // Add ordering and pagination
    sql += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    
    // Execute the query
    const result = await query(sql, params);
    
    // Count total for pagination info
    let countSql = 'SELECT COUNT(*) FROM trades';
    if (walletAddress) {
      countSql += ' WHERE wallet_address = $1';
    }
    const countResult = await query(countSql, walletAddress ? [walletAddress] : []);
    const total = parseInt(countResult.rows[0].count, 10);
    
    // Return the trades with pagination metadata
    return NextResponse.json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + result.rows.length < total
      }
    });
    
  } catch (error) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}