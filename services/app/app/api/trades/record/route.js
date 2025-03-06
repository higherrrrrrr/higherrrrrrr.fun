import { NextResponse } from 'next/server';
import { query } from '@/models/db';
import { heliusClient } from '@/lib/helius/client';
import { updatePositionAfterTrade } from '@/lib/positions/positionService';
import { getTokenMetadata } from '@/lib/tokens/tokenService';

export async function POST(request) {
  try {
    const tradeData = await request.json();
    console.log('Received trade data:', tradeData);
    
    // Check if this transaction has already been processed
    const existingTrade = await query(
      `SELECT id, side FROM trades 
       WHERE transaction_hash = $1 AND wallet_address = $2`,
      [tradeData.transaction_hash, tradeData.wallet_address]
    );
    
    // If this exact transaction + side combination already exists, return early with success
    if (existingTrade.rows.length > 0) {
      console.log(`Trade for transaction ${tradeData.transaction_hash} already exists, skipping`);
      return NextResponse.json({
        success: true,
        trade_id: existingTrade.rows[0].id,
        message: 'Trade already recorded previously'
      });
    }
    
    // Convert raw token amounts to actual amounts by dividing by 10^decimals
    // This is critical for accurate value calculations
    
    // Handle token_in amount
    if (tradeData.token_in && tradeData.amount_in) {
      try {
        const tokenInMeta = await getTokenMetadata(tradeData.token_in);
        const decimals = tokenInMeta?.decimals || 9; // Default to 9 if not found
        
        // Convert raw amount to human-readable amount
        const rawAmount = parseFloat(tradeData.amount_in);
        const actualAmount = rawAmount / Math.pow(10, decimals);
        
        console.log(`Converting token_in: raw=${rawAmount}, decimals=${decimals}, actual=${actualAmount}`);
        
        // Store both raw and adjusted amounts
        tradeData.amount_in_raw = tradeData.amount_in;
        tradeData.amount_in = actualAmount;
        
        // Recalculate value with the correct amount
        if (tradeData.price_in_usd) {
          tradeData.value_in_usd = actualAmount * parseFloat(tradeData.price_in_usd);
        }
      } catch (error) {
        console.error('Error converting token_in amount:', error);
        // Continue with original values if conversion fails
      }
    }
    
    // Handle token_out amount
    if (tradeData.token_out && tradeData.amount_out) {
      try {
        const tokenOutMeta = await getTokenMetadata(tradeData.token_out);
        const decimals = tokenOutMeta?.decimals || 9; // Default to 9 if not found
        
        // Convert raw amount to human-readable amount
        const rawAmount = parseFloat(tradeData.amount_out);
        const actualAmount = rawAmount / Math.pow(10, decimals);
        
        console.log(`Converting token_out: raw=${rawAmount}, decimals=${decimals}, actual=${actualAmount}`);
        
        // Store both raw and adjusted amounts
        tradeData.amount_out_raw = tradeData.amount_out;
        tradeData.amount_out = actualAmount;
        
        // Recalculate value with the correct amount
        if (tradeData.price_out_usd) {
          tradeData.value_out_usd = actualAmount * parseFloat(tradeData.price_out_usd);
        }
      } catch (error) {
        console.error('Error converting token_out amount:', error);
        // Continue with original values if conversion fails
      }
    }
    
    // If price data not provided, fetch from Helius
    if (!tradeData.price_in_usd || !tradeData.price_out_usd || 
        tradeData.price_in_usd === '0' || tradeData.price_out_usd === '0') {
      console.log('Fetching token prices from Helius');
      
      try {
        const priceData = await heliusClient.getTokenPrices([
          tradeData.token_in, 
          tradeData.token_out
        ].filter(Boolean)); // Filter out null/undefined tokens
        
        console.log('Helius price data:', priceData);
        
        if (priceData) {
          if (tradeData.token_in && priceData[tradeData.token_in]) {
            tradeData.price_in_usd = priceData[tradeData.token_in].toString();
            // Update value_in_usd with the new price and proper decimal-adjusted amount
            if (tradeData.amount_in) {
              tradeData.value_in_usd = parseFloat(tradeData.amount_in) * parseFloat(tradeData.price_in_usd);
            }
          }
          
          if (tradeData.token_out && priceData[tradeData.token_out]) {
            tradeData.price_out_usd = priceData[tradeData.token_out].toString();
            // Update value_out_usd with the new price and proper decimal-adjusted amount
            if (tradeData.amount_out) {
              tradeData.value_out_usd = parseFloat(tradeData.amount_out) * parseFloat(tradeData.price_out_usd);
            }
          }
        }
      } catch (priceError) {
        console.error('Error fetching price data:', priceError);
      }
    }
    
    // Extract fields
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
    
    // Determine trade side (buy/sell) for compatibility with portfolio analytics
    const side = token_in && amount_in > 0 ? 'sell' : 'buy';
    
    // Insert the trade record - use empty strings for null token values 
    const result = await query(
      `INSERT INTO trades 
       (transaction_hash, wallet_address, token_in, token_out, amount_in, amount_out, 
        block_timestamp, price_in_usd, price_out_usd, value_in_usd, value_out_usd,
        side, realized_pnl, token_address, amount, price_usd, value_usd) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 0,
               $13, $14, $15, $16) 
       RETURNING id`,
      [
        transaction_hash, wallet_address, 
        token_in || '', // Use empty string instead of null
        token_out || '', // Use empty string instead of null 
        amount_in || 0, 
        amount_out || 0,
        block_timestamp, 
        price_in_usd || 0, 
        price_out_usd || 0,
        value_in_usd || 0, 
        value_out_usd || 0, 
        side,
        // Add unified columns for compatibility
        side === 'sell' ? token_in : token_out,
        side === 'sell' ? amount_in : amount_out,
        side === 'sell' ? price_in_usd : price_out_usd,
        side === 'sell' ? value_in_usd : value_out_usd
      ]
    );
    
    // Update positions and user stats
    try {
      // Pass the adjusted tradeData with decimal-corrected amounts
      await updatePositionAfterTrade(tradeData);
    } catch (positionError) {
      console.error('Error updating position:', positionError);
      // Continue execution - we've already recorded the trade
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      trade_id: result.rows[0].id,
      message: 'Trade recorded successfully with position tracking'
    });
  } catch (error) {
    console.error('Error recording trade:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
} 