import { NextResponse } from 'next/server';
import { trackAchievement, ACTIONS } from '@/lib/achievements';

export async function POST(request) {
  try {
    const { txid, wallet_address, token_address } = await request.json();
    
    // Validate required parameters
    if (!txid || !wallet_address || !token_address) {
      return NextResponse.json(
        { error: 'Missing required parameters: txid, wallet_address, token_address' },
        { status: 400 }
      );
    }
    
    console.log(`Processing Jupiter transaction: ${txid} for wallet ${wallet_address} with token ${token_address}`);
    
    // Track achievement for this swap
    try {
      // Use the trackAchievement function
      await trackAchievement(wallet_address, ACTIONS.TRADE, {
        amount: 1, // Use a default amount since we don't have the exact value
        token_mint: token_address,
        tx_hash: txid
      });
      
      console.log('Tracked Jupiter swap achievement for wallet:', wallet_address);
    } catch (progressError) {
      console.error('Error tracking achievement progress:', progressError);
      // Continue execution even if achievement processing fails
    }

    return NextResponse.json({ 
      success: true,
      message: "Transaction processed successfully",
      data: {
        txid,
        wallet_address,
        token_address,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error processing Jupiter transaction:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction' },
      { status: 500 }
    );
  }
} 