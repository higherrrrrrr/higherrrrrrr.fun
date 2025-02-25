import pool from './db.js';

// Get all achievement types
export async function getAchievementTypes() {
  try {
    const result = await pool.query('SELECT * FROM achievement_types ORDER BY id');
    return result.rows;
  } catch (error) {
    console.error('Error fetching achievement types:', error);
    throw error;
  }
}

// Get user achievements
export async function getUserAchievements(wallet) {
  try {
    const result = await pool.query(`
      SELECT ua.*, at.name, at.description, at.icon, at.reward_type, at.reward_amount, ua.completion_count
      FROM user_achievements ua
      JOIN achievement_types at ON ua.achievement_type = at.id
      WHERE ua.wallet = $1 
      ORDER BY ua.completed_at DESC
    `, [wallet]);
    
    return result.rows;
  } catch (error) {
    console.error(`Error fetching achievements for wallet ${wallet}:`, error);
    throw error;
  }
}

// Get achievement progress for a user
export async function getAchievementProgress(wallet) {
  try {
    const result = await pool.query(`
      SELECT ap.*, at.name, at.description, at.icon, at.target_value, at.target_type
      FROM achievement_progress ap
      JOIN achievement_types at ON ap.achievement_id = at.id
      WHERE ap.wallet_address = $1
      ORDER BY ap.updated_at DESC
    `, [wallet]);
    return result.rows;
  } catch (error) {
    console.error(`Error fetching achievement progress for wallet ${wallet}:`, error);
    throw error;
  }
}

// Update achievement progress
export async function updateAchievementProgress(wallet, achievementId, data) {
  const { progress, trade_volume, trade_count, completed, token_mint, first_purchase_date } = data;
  
  try {
    // Check if progress record exists
    const existingRecord = await pool.query(
      'SELECT * FROM achievement_progress WHERE wallet_address = $1 AND achievement_id = $2',
      [wallet, achievementId]
    );
    
    if (existingRecord.rows.length === 0) {
      // Create new progress record
      const result = await pool.query(`
        INSERT INTO achievement_progress(
          wallet_address, achievement_id, progress, trade_volume, 
          trade_count, completed, token_mint, first_purchase_date, 
          created_at, updated_at
        ) 
        VALUES($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        wallet, achievementId, progress || 0, trade_volume || 0, 
        trade_count || 0, completed || false, token_mint, first_purchase_date
      ]);
      return result.rows[0];
    } else {
      // Update existing record
      const result = await pool.query(`
        UPDATE achievement_progress 
        SET 
          progress = $3,
          trade_volume = $4,
          trade_count = $5,
          completed = $6,
          token_mint = $7,
          first_purchase_date = $8,
          updated_at = NOW()
        WHERE wallet_address = $1 AND achievement_id = $2
        RETURNING *
      `, [
        wallet, achievementId, progress, trade_volume, 
        trade_count, completed, token_mint, first_purchase_date
      ]);
      return result.rows[0];
    }
  } catch (error) {
    console.error(`Error updating achievement progress for wallet ${wallet}:`, error);
    throw error;
  }
}

// Add a completed achievement
export async function addUserAchievement(data) {
  const { user_id, wallet, achievement_type, token_mint, tx_signature } = data;
  
  try {
    const result = await pool.query(`
      INSERT INTO user_achievements(
        user_id, wallet, achievement_type, token_mint, tx_signature, created_at
      )
      VALUES($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (wallet, achievement_type, token_mint) 
      DO UPDATE SET created_at = NOW()
      RETURNING *
    `, [user_id, wallet, achievement_type, token_mint, tx_signature]);
    
    return result.rows[0];
  } catch (error) {
    console.error(`Error adding user achievement for wallet ${wallet}:`, error);
    throw error;
  }
} 