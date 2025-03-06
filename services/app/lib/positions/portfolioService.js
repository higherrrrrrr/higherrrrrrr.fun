import { query } from '@/models/db';
import { getTokenMetadata } from '@/lib/tokens/tokenService';

/**
 * Get enhanced position data with token symbols and additional metadata
 */
export async function getEnhancedPortfolio(walletAddress) {
  try {
    // Get basic position data
    const positionsResult = await query(
      `SELECT 
        p.id, p.wallet_address, p.token_address, p.quantity, 
        p.avg_cost_basis, p.last_price, p.unrealized_pnl, p.token_decimals,
        p.quantity * p.last_price as market_value,
        p.quantity * p.avg_cost_basis as cost_basis,
        CASE WHEN p.avg_cost_basis > 0 
          THEN (p.last_price - p.avg_cost_basis) / p.avg_cost_basis 
          ELSE 0 
        END as unrealized_pnl_percent
      FROM positions p
      WHERE p.wallet_address = $1
      ORDER BY market_value DESC`,
      [walletAddress]
    );

    // Fetch token metadata for all tokens in one batch
    const tokenAddresses = positionsResult.rows.map(pos => pos.token_address);
    const tokenInfoPromises = tokenAddresses.map(addr => getTokenMetadata(addr));
    const tokenInfoResults = await Promise.all(tokenInfoPromises);
    
    // Create a map of token addresses to metadata
    const tokenMetadataMap = {};
    tokenInfoResults.forEach(info => {
      if (info && info.token_address) {
        tokenMetadataMap[info.token_address] = info;
      }
    });
    
    // Enhance positions with token metadata
    const enhancedPositions = positionsResult.rows.map(pos => {
      const metadata = tokenMetadataMap[pos.token_address] || {};
      return {
        ...pos,
        token_symbol: metadata.symbol || pos.token_address.substring(0, 6) + '...',
        token_name: metadata.name || 'Unknown Token',
        token_logo: metadata.logo_url || null
      };
    });

    return enhancedPositions;
  } catch (error) {
    console.error('Error fetching enhanced portfolio:', error);
    throw error;
  }
}

/**
 * Get historical PnL data for charting
 * @param {string} walletAddress - The wallet address
 * @param {string} period - The time period ('day', 'week', 'month', 'year')
 * @returns {Array} - Array of PnL data points with timestamps
 */
export async function getHistoricalPnL(walletAddress, period = 'month') {
  try {
    // Define time window based on period
    let timeWindow;
    switch (period) {
      case 'day':
        timeWindow = '1 day';
        break;
      case 'week':
        timeWindow = '7 days';
        break;
      case 'month':
        timeWindow = '30 days';
        break;
      case 'year':
        timeWindow = '365 days';
        break;
      default:
        timeWindow = '30 days';
    }
    
    // Get realized PnL from trades table
    const tradesResult = await query(
      `SELECT 
        transaction_hash,
        block_timestamp,
        realized_pnl,
        SUM(realized_pnl) OVER (ORDER BY block_timestamp) AS cumulative_pnl
      FROM trades 
      WHERE wallet_address = $1 
        AND block_timestamp >= NOW() - INTERVAL '${timeWindow}'
        AND realized_pnl != 0
      ORDER BY block_timestamp ASC`,
      [walletAddress]
    );
    
    // If no trade history, return empty array
    if (tradesResult.rows.length === 0) {
      return [];
    }
    
    // Get current unrealized PnL from positions
    const positionsResult = await query(
      `SELECT SUM(unrealized_pnl) AS total_unrealized_pnl
       FROM positions
       WHERE wallet_address = $1`,
      [walletAddress]
    );
    
    const totalUnrealizedPnl = positionsResult.rows[0]?.total_unrealized_pnl || 0;
    const lastCumulativePnl = tradesResult.rows[tradesResult.rows.length - 1]?.cumulative_pnl || 0;
    
    // Format the data for the chart
    const chartData = tradesResult.rows.map(row => ({
      timestamp: row.block_timestamp,
      date: new Date(row.block_timestamp).toISOString().split('T')[0],
      realized_pnl: parseFloat(row.realized_pnl),
      cumulative_pnl: parseFloat(row.cumulative_pnl)
    }));
    
    // Add current point with unrealized PnL
    chartData.push({
      timestamp: new Date(),
      date: new Date().toISOString().split('T')[0],
      realized_pnl: 0,
      cumulative_pnl: parseFloat(lastCumulativePnl) + parseFloat(totalUnrealizedPnl),
      unrealized_pnl: parseFloat(totalUnrealizedPnl)
    });
    
    return chartData;
  } catch (error) {
    console.error('Error fetching historical PnL:', error);
    throw error;
  }
}

/**
 * Get complete portfolio summary for a wallet
 * Includes realized PnL from user_stats + unrealized PnL from current positions
 */
export async function getPortfolioSummary(walletAddress) {
  // Get user stats for realized PnL
  const statsResult = await query(
    `SELECT total_realized_pnl, total_volume, trade_count
     FROM user_stats
     WHERE wallet_address = $1`,
    [walletAddress]
  );
  
  // Get current positions for unrealized PnL
  const positionsResult = await query(
    `SELECT 
       token_address,
       quantity,
       avg_cost_basis,
       last_price,
       unrealized_pnl,
       total_cost_basis,
       token_decimals
     FROM positions
     WHERE wallet_address = $1 AND quantity > 0`,
    [walletAddress]
  );
  
  // Calculate total unrealized PnL
  const positions = positionsResult.rows;
  let totalUnrealizedPnl = 0;
  let totalPositionValue = 0;
  
  positions.forEach(position => {
    const unrealizedPnl = parseFloat(position.unrealized_pnl);
    totalUnrealizedPnl += unrealizedPnl;
    
    const positionValue = parseFloat(position.quantity) * parseFloat(position.last_price);
    totalPositionValue += positionValue;
  });
  
  // Get user stats or default values
  const stats = statsResult.rows[0] || { 
    total_realized_pnl: 0, 
    total_volume: 0, 
    trade_count: 0 
  };
  
  // Calculate total PnL
  const totalRealizedPnl = parseFloat(stats.total_realized_pnl);
  const totalPnl = totalRealizedPnl + totalUnrealizedPnl;
  
  return {
    total_realized_pnl: totalRealizedPnl,
    total_unrealized_pnl: totalUnrealizedPnl,
    total_pnl: totalPnl,
    position_count: positions.length,
    total_position_value: totalPositionValue,
    total_volume: parseFloat(stats.total_volume),
    trade_count: parseInt(stats.trade_count),
    positions: positions
  };
} 