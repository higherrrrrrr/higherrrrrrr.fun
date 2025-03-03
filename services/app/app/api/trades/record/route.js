import { NextResponse } from 'next/server';
import { query } from '@/models/db';
import { heliusClient } from '@/lib/helius/client';

export async function POST(request) {
  try {
    const tradeData = await request.json();
    console.log('Received trade data:', tradeData);
    
    // If price data not provided, fetch from Helius
    if (!tradeData.price_in_usd || !tradeData.price_out_usd || 
        tradeData.price_in_usd === '0' || tradeData.price_out_usd === '0') {
      console.log('Fetching token prices from Helius');
      
      try {
        // This is the crucial part - make sure this function call happens
        const priceData = await heliusClient.getTokenPrices([
          tradeData.token_in, 
          tradeData.token_out
        ]);
        
        console.log('Helius price data:', priceData);
        
        if (priceData) {
          if (priceData[tradeData.token_in]) {
            tradeData.price_in_usd = priceData[tradeData.token_in].toString();
          }
          
          if (priceData[tradeData.token_out]) {
            tradeData.price_out_usd = priceData[tradeData.token_out].toString();
          }
        }
      } catch (priceError) {
        console.error('Error fetching price data:', priceError);
      }
    }
    
    // Extract fields, excluding fees
    const {
      transaction_hash,
      wallet_address,
      token_in,
      token_out,
      amount_in,
      amount_out,
      block_timestamp,
      price_in_usd,
      price_out_usd,
      value_in_usd,
      value_out_usd
    } = tradeData;

    // Modified query without the fees column
    const result = await query(
      `INSERT INTO trades 
       (transaction_hash, wallet_address, token_in, token_out, amount_in, amount_out, 
        block_timestamp, price_in_usd, price_out_usd, value_in_usd, value_out_usd) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id`,
      [
        transaction_hash, wallet_address, token_in, token_out, amount_in, amount_out, 
        block_timestamp, price_in_usd || 0, price_out_usd || 0, 
        value_in_usd || 0, value_out_usd || 0
      ]
    );
    
    // Return success response
    return NextResponse.json({
      success: true,
      trade_id: result.rows[0].id,
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