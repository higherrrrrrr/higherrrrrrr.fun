import { query } from '@/models/db';
import { heliusClient } from '@/lib/helius/client';
import { getTokenMetadata } from '@/lib/tokens/tokenService';

/**
 * Updates a user's position after a trade
 * Handles cost basis calculation, PnL tracking, and user stats
 */
export async function updatePositionAfterTrade(tradeData) {
  const {
    wallet_address,
    token_in,
    token_out,
    amount_in,
    amount_out,
    price_in_usd,
    price_out_usd,
    transaction_hash
  } = tradeData;
  
  console.log(`Processing trade with decimal-adjusted amounts: `, {
    amount_in: amount_in,
    amount_out: amount_out,
  });
  
  try {
    // Start a database transaction
    await query('BEGIN');
    
    // Process the tokens being sold (token_in)
    let realizedPnl = 0;
    let sellTradeId = null;
    let sellValue = 0;
    
    if (amount_in && amount_in !== '0') {
      const sellResult = await processTokenSale(
        wallet_address, 
        token_in, 
        parseFloat(amount_in), 
        parseFloat(price_in_usd),
        transaction_hash
      );
      
      realizedPnl = sellResult.realizedPnl;
      sellTradeId = sellResult.tradeId;
      sellValue = parseFloat(amount_in) * parseFloat(price_in_usd);
    }
    
    // Process the tokens being bought (token_out) - use the sell value as the notional
    // This ensures cost basis continuity between assets
    let buyTradeId = null;
    if (amount_out && amount_out !== '0') {
      // If this is a swap, pass the sell notional to maintain cost basis chain
      const notionalValue = sellValue > 0 ? sellValue : null;
      
      const buyResult = await processTokenPurchase(
        wallet_address, 
        token_out, 
        parseFloat(amount_out), 
        parseFloat(price_out_usd),
        transaction_hash,
        notionalValue // Add this parameter
      );
      
      buyTradeId = buyResult.tradeId;
    }
    
    // Update user stats with the calculated PnL
    const tradeValue = Math.max(
      parseFloat(amount_in) * parseFloat(price_in_usd),
      parseFloat(amount_out) * parseFloat(price_out_usd)
    );
    
    await updateUserStats(wallet_address, {
      ...tradeData,
      trade_value: tradeValue,
      realized_pnl: realizedPnl // Ensure this is passed to user stats
    });
    
    await query('COMMIT');
    
    return {
      success: true,
      realizedPnl,
      sellTradeId,
      buyTradeId
    };
  } catch (error) {
    console.error('Error updating position:', error);
    await query('ROLLBACK');
    throw error;
  }
}

/**
 * Process a token sale (decrease position)
 * Returns realized PnL and trade ID
 */
async function processTokenSale(walletAddress, tokenAddress, amount, price, transactionHash) {
  // Get current position
  const positionResult = await query(
    `SELECT * FROM positions 
     WHERE wallet_address = $1 AND token_address = $2
     FOR UPDATE`,
    [walletAddress, tokenAddress]
  );
  
  // If no position exists, create one (this might happen for first-time sales or token airdrops)
  if (positionResult.rows.length === 0) {
    console.warn(`No existing position for ${walletAddress} and token ${tokenAddress}`);
    
    // Get token decimals for new position
    const tokenInfo = await getTokenMetadata(tokenAddress);
    
    // Create a position record with zero quantity
    await query(
      `INSERT INTO positions 
       (wallet_address, token_address, quantity, avg_cost_basis, last_price, unrealized_pnl, token_decimals, total_cost_basis)
       VALUES ($1, $2, 0, $3, $3, 0, $4, 0)`,
      [walletAddress, tokenAddress, price, tokenInfo.decimals || 9]
    );
    
    // Record the trade with zero realized PnL - using different parameters and empty string for token_out
    const tradeResult = await query(
      `INSERT INTO trades
       (transaction_hash, wallet_address, token_in, token_out, amount_in, amount_out, 
        price_in_usd, price_out_usd, value_in_usd, value_out_usd, block_timestamp,
        token_address, amount, price_usd, value_usd, realized_pnl, side)
       VALUES ($1, $2, $3, '', $4::NUMERIC, 0, $5::NUMERIC, 0, $6::NUMERIC, 0, NOW(), 
               $7, $8::NUMERIC, $9::NUMERIC, $10::NUMERIC, 0, 'sell')
       RETURNING id`,
      [
        transactionHash, walletAddress, tokenAddress, amount, price, amount * price,
        tokenAddress, amount, price, amount * price
      ]
    );
    
    return { 
      realizedPnl: 0,
      tradeId: tradeResult.rows[0].id
    };
  }
  
  // Normal flow for existing positions...
  const position = positionResult.rows[0];
  const currentQuantity = parseFloat(position.quantity);
  const avgCostBasis = parseFloat(position.avg_cost_basis);
  
  // Safety check: Don't allow selling more than owned
  if (amount > currentQuantity) {
    console.warn(`Attempting to sell ${amount} tokens but user only has ${currentQuantity}`);
    amount = currentQuantity; // Cap at available quantity
  }
  
  // Calculate realized PnL for the sold portion (value-based)
  const saleValue = amount * price;
  const costBasisValue = amount * avgCostBasis;
  const totalCostBasis = parseFloat(position.total_cost_basis || (currentQuantity * avgCostBasis).toFixed(12));
  
  // Calculate realized PnL with proper precision
  const realizedPnl = parseFloat((saleValue - costBasisValue).toFixed(12));
  
  console.log(`Calculating PnL: Sale value ${saleValue} - Cost basis ${costBasisValue} = ${realizedPnl}`);
  
  // Update the position
  const newQuantity = currentQuantity - amount;
  const newTotalCostBasis = totalCostBasis - costBasisValue;
  
  // Record the trade first with realized PnL - using empty string instead of NULL for token_out
  const tradeResult = await query(
    `INSERT INTO trades
     (transaction_hash, wallet_address, token_in, token_out, amount_in, amount_out, 
      price_in_usd, price_out_usd, value_in_usd, value_out_usd, block_timestamp,
      token_address, amount, price_usd, value_usd, realized_pnl, side)
     VALUES ($1, $2, $3, '', $4::NUMERIC, 0, $5::NUMERIC, 0, $6::NUMERIC, 0, NOW(),
             $7, $8::NUMERIC, $9::NUMERIC, $10::NUMERIC, $11::NUMERIC, 'sell')
     RETURNING id`,
    [
      transactionHash, walletAddress, tokenAddress, amount, price, saleValue,
      tokenAddress, amount, price, saleValue, realizedPnl
    ]
  );
  
  // Update the position record
  await query(
    `UPDATE positions 
     SET quantity = $1::NUMERIC, 
         total_cost_basis = $2::NUMERIC,
         last_price = $3::NUMERIC,
         unrealized_pnl = ($3::NUMERIC - avg_cost_basis) * $1::NUMERIC,
         updated_at = NOW()
     WHERE wallet_address = $4 AND token_address = $5`,
    [newQuantity, newTotalCostBasis, price, walletAddress, tokenAddress]
  );
  
  return { 
    realizedPnl,
    tradeId: tradeResult.rows[0].id
  };
}

/**
 * Process a token purchase (increase position)
 * Returns trade ID
 * Added notionalValue parameter to maintain cost basis chain in swaps
 */
async function processTokenPurchase(walletAddress, tokenAddress, amount, price, transactionHash, notionalValue = null) {
  // Get token decimals
  const tokenInfo = await getTokenMetadata(tokenAddress);
  
  // Ensure numeric types for calculations
  amount = parseFloat(amount);
  price = parseFloat(price);
  const purchaseValue = amount * price;
  const effectivePrice = price; // We'll use this if notionalValue isn't provided
  
  // Get current position
  const positionResult = await query(
    `SELECT * FROM positions 
     WHERE wallet_address = $1 AND token_address = $2
     FOR UPDATE`,
    [walletAddress, tokenAddress]
  );
  
  // Record the buy trade with explicit numeric casts
  const tradeResult = await query(
    `INSERT INTO trades
     (transaction_hash, wallet_address, token_in, token_out, amount_in, amount_out, 
      price_in_usd, price_out_usd, value_in_usd, value_out_usd, block_timestamp,
      token_address, amount, price_usd, value_usd, realized_pnl, side)
     VALUES ($1, $2, '', $3, 0, $4::NUMERIC, 0, $5::NUMERIC, 0, $6::NUMERIC, NOW(),
             $7, $8::NUMERIC, $9::NUMERIC, $10::NUMERIC, 0, 'buy')
     RETURNING id`,
    [
      transactionHash, walletAddress, tokenAddress, amount, price, purchaseValue,
      tokenAddress, amount, price, purchaseValue
    ]
  );
  
  // If no position exists, create one
  if (positionResult.rows.length === 0) {
    // Create a new position with explicit numeric casting
    await query(
      `INSERT INTO positions 
       (wallet_address, token_address, quantity, avg_cost_basis, last_price, 
        unrealized_pnl, total_cost_basis, token_decimals)
       VALUES ($1, $2, $3::NUMERIC, $4::NUMERIC, $5::NUMERIC, 0, $6::NUMERIC, $7)`,
      [
        walletAddress, 
        tokenAddress, 
        amount, 
        price, 
        price, 
        amount * price, 
        tokenInfo.decimals || 9
      ]
    );
    
    return { tradeId: tradeResult.rows[0].id };
  }
  
  // Update existing position with explicit numeric casting
  const position = positionResult.rows[0];
  const currentQuantity = parseFloat(position.quantity);
  const avgCostBasis = parseFloat(position.avg_cost_basis);
  
  // Calculate new position values using weighted average
  const newQuantity = currentQuantity + amount;
  const currentTotalCost = parseFloat(position.total_cost_basis || (currentQuantity * avgCostBasis));
  const additionalCost = amount * price;
  const newTotalCost = currentTotalCost + additionalCost;
  const newAvgCostBasis = newTotalCost / newQuantity;
  const unrealizedPnl = (price - newAvgCostBasis) * newQuantity;

  // Update the position with explicit casts
  await query(
    `UPDATE positions 
     SET quantity = $1::NUMERIC, 
         avg_cost_basis = $2::NUMERIC,
         last_price = $3::NUMERIC,
         unrealized_pnl = ($3::NUMERIC - $2::NUMERIC) * $1::NUMERIC,
         total_cost_basis = $4::NUMERIC,
         updated_at = NOW()
     WHERE wallet_address = $5 AND token_address = $6`,
    [newQuantity, newAvgCostBasis, price, newTotalCost, walletAddress, tokenAddress]
  );
  
  return { tradeId: tradeResult.rows[0].id };
}

/**
 * Update user statistics after a trade
 */
async function updateUserStats(walletAddress, tradeData, realizedPnl = 0) {
  const { trade_value } = tradeData;
  
  try {
    // First try to update existing stats with a more resilient approach
    const result = await query(
      `UPDATE user_stats
       SET total_realized_pnl = total_realized_pnl + $1,
           total_volume = total_volume + $2,
           trade_count = trade_count + 1,
           updated_at = NOW()
       WHERE wallet_address = $3
       RETURNING id`,
      [realizedPnl || 0, trade_value || 0, walletAddress]
    );
    
    // Try to update timestamp columns separately to handle case where they might not exist
    try {
      await query(
        `UPDATE user_stats
         SET first_trade_at = COALESCE(first_trade_at, NOW()),
             last_trade_at = NOW()
         WHERE wallet_address = $1`,
        [walletAddress]
      );
    } catch (e) {
      console.warn('Could not update timestamp columns, they may not exist yet:', e.message);
      // Continue execution, don't fail the whole update
    }
    
    // If no row was updated, insert new stats
    if (result.rowCount === 0) {
      // Use a more minimal insert to avoid column existence problems
      await query(
        `INSERT INTO user_stats
         (wallet_address, total_realized_pnl, total_volume, trade_count)
         VALUES ($1, $2, $3, 1)`,
        [walletAddress, realizedPnl || 0, trade_value || 0]
      );
      
      // Try to update timestamps separately
      try {
        await query(
          `UPDATE user_stats
           SET first_trade_at = NOW(),
               last_trade_at = NOW()
           WHERE wallet_address = $1`,
          [walletAddress]
        );
      } catch (e) {
        console.warn('Could not update new row timestamp columns:', e.message);
      }
    }
  } catch (error) {
    console.error('Error updating user stats:', error);
    // Don't rethrow - this shouldn't block the rest of the transaction
  }
}

/**
 * Get user positions with current prices for portfolio view
 */
export async function getUserPositions(walletAddress) {
  try {
    const positionResult = await query(
      'SELECT * FROM positions WHERE wallet_address = $1 AND quantity > 0',
      [walletAddress]
    );
    
    if (positionResult.rows.length === 0) {
      return [];
    }
    
    // Get token addresses for price update
    const tokenAddresses = positionResult.rows.map(pos => pos.token_address);
    
    // Fetch current prices from Helius
    const currentPrices = await heliusClient.getTokenPrices(tokenAddresses);
    
    // Update positions with current prices
    const updatedPositions = await Promise.all(positionResult.rows.map(async (position) => {
      const currentPrice = currentPrices[position.token_address] 
        ? parseFloat(currentPrices[position.token_address]) 
        : parseFloat(position.last_price);
      
      const quantity = parseFloat(position.quantity);
      const avgCostBasis = parseFloat(position.avg_cost_basis);
      const marketValue = quantity * currentPrice;
      const costBasis = quantity * avgCostBasis;
      const unrealizedPnl = marketValue - costBasis;
      const unrealizedPnlPercent = costBasis > 0 
        ? (unrealizedPnl / costBasis) * 100 
        : 0;
      
      // Update position with latest price and PnL if price changed
      if (currentPrice !== parseFloat(position.last_price)) {
        await query(
          `UPDATE positions 
           SET last_price = $1, 
               unrealized_pnl = $2,
               updated_at = NOW()
           WHERE id = $3`,
          [currentPrice, unrealizedPnl, position.id]
        );
      }
      
      return {
        ...position,
        current_price: currentPrice,
        market_value: marketValue,
        cost_basis: costBasis,
        unrealized_pnl: unrealizedPnl,
        unrealized_pnl_percent: unrealizedPnlPercent
      };
    }));
    
    return updatedPositions;
  } catch (error) {
    console.error('Error getting user positions:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStats(walletAddress) {
  try {
    const statsResult = await query(
      'SELECT * FROM user_stats WHERE wallet_address = $1',
      [walletAddress]
    );
    
    if (statsResult.rows.length === 0) {
      return {
        wallet_address: walletAddress,
        total_volume: 0,
        total_realized_pnl: 0,
        trade_count: 0,
        largest_trade_value: 0
      };
    }
    
    return statsResult.rows[0];
  } catch (error) {
    console.error('Error getting user stats:', error);
    throw error;
  }
}

/**
 * Get leaderboard data
 */
export async function getLeaderboard(sortBy = 'total_realized_pnl', limit = 20) {
  try {
    const validSortColumns = [
      'total_realized_pnl', 
      'total_volume', 
      'trade_count',
      'largest_trade_value'
    ];
    
    const sortColumn = validSortColumns.includes(sortBy) 
      ? sortBy 
      : 'total_realized_pnl';
    
    console.log("EXECUTING LEADERBOARD QUERY:", `SELECT * FROM user_stats ORDER BY ${sortColumn} DESC LIMIT $1`);
    const leaderboardResult = await query(
      `SELECT * FROM user_stats 
       ORDER BY ${sortColumn} DESC 
       LIMIT $1`,
      [limit]
    );
    
    return leaderboardResult.rows;
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    throw error;
  }
}
