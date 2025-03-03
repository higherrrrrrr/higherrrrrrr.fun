import { NextResponse } from 'next/server';
import { query } from '@/models/db';

export async function POST(request) {
  try {
    const {
      transaction_hash,
      wallet_address,
      token_in,
      token_out,
      amount_in,
      amount_out,
      block_timestamp
    } = await request.json();
    
    // Validate required fields
    if (!transaction_hash || !wallet_address || !token_in || !token_out) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters' 
      }, { status: 400 });
    }

    // Record the trade in the database
    const result = await query(
      `INSERT INTO trades 
        (transaction_hash, wallet_address, token_in, token_out, amount_in, amount_out, block_timestamp, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       ON CONFLICT (transaction_hash) DO NOTHING
       RETURNING id`,
      [transaction_hash, wallet_address, token_in, token_out, amount_in || 0, amount_out || 0, block_timestamp || new Date()]
    );
    
    const insertedId = result.rows[0]?.id;
    
    // Log the trade
    console.log(`📊 Recorded trade for wallet ${wallet_address}, tx: ${transaction_hash}`);
    
    return NextResponse.json({ 
      success: true,
      trade_id: insertedId,
      message: 'Trade recorded successfully'
    });
    
  } catch (error) {
    console.error('Error recording trade:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
} 