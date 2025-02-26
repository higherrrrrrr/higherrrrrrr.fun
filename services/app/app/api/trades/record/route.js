import { trackAchievement, ACTIONS } from '@/lib/achievements.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { wallet, txHash, tokenA, tokenB, amount } = body;
    
    if (!wallet || !txHash || !amount) {
      return NextResponse.json(
        { error: 'Wallet address, transaction hash, and amount are required' },
        { status: 400 }
      );
    }
    
    console.log('Trade record API received:', body);
    
    // Track the swap as a trade achievement
    await trackAchievement(wallet, ACTIONS.TRADE, {
      amount,
      token_mint: tokenB,  // Record the token they swapped to
      tx_hash: txHash
    });
    
    console.log('Trade achievement tracked successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Trade recorded successfully'
    });
  } catch (error) {
    console.error('Error recording trade:', error);
    return NextResponse.json(
      { error: 'Failed to record trade' },
      { status: 500 }
    );
  }
}