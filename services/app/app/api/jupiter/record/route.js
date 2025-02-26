import { Pool } from 'pg';
import { trackAchievement, ACTIONS } from '@/lib/achievements';
import { NextResponse } from 'next/server';

// Get database connection string from environment variables
const DATABASE_URL = process.env.DATABASE_URL;

// Create database connection pool
const pool = new Pool({
  connectionString: DATABASE_URL,
});

export async function POST(request) {
  try {
    // Get the transaction data
    const body = await request.json();
    const { txid, inputMint, walletAddress, outputMint, amount } = body;

    if (!txid || !inputMint) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    console.log('Processing Jupiter swap with data:', { txid, inputMint, walletAddress, outputMint, amount });
    
    // First check if this transaction has already been recorded
    const checkResult = await pool.query(
      'SELECT * FROM jupiter_swaps WHERE txid = $1',
      [txid]
    );
    
    if (checkResult.rows.length > 0) {
      console.log('Transaction already recorded:', txid);
      return NextResponse.json({ 
        success: true, 
        message: 'Transaction already recorded',
        txid
      });
    }
    
    // Create the Jupiter swap record
    const result = await pool.query(
      'INSERT INTO jupiter_swaps (txid, input_mint, wallet_address, user_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING *',
      [txid, inputMint, walletAddress, null] // No user_id for now
    );
    
    const jupiterSwap = result.rows[0];
    console.log('Recorded Jupiter swap:', jupiterSwap);

    // Track achievement progress for this swap using the standard tracker
    if (walletAddress) {
      try {
        // Use the trackAchievement function from achievements.js
        await trackAchievement(walletAddress, ACTIONS.TRADE, {
          amount: parseFloat(amount) || 1,
          token_mint: outputMint || inputMint,
          tx_hash: txid
        });
        
        console.log('Tracked Jupiter swap achievement for wallet:', walletAddress);
      } catch (progressError) {
        console.error('Error tracking achievement progress:', progressError);
        // Continue execution even if achievement processing fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: jupiterSwap 
    });
  } catch (error) {
    console.error('Error recording Jupiter swap:', error);
    return NextResponse.json(
      { error: 'Failed to record Jupiter swap' },
      { status: 500 }
    );
  }
} 