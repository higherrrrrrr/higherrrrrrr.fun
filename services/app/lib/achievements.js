import pool from '../models/db.js';

// Achievement action types
export const ACTIONS = {
  TRADE: 'TRADE',
  PURCHASE: 'PURCHASE',
  DEPOSIT: 'DEPOSIT',
  WITHDRAW: 'WITHDRAW',
  INVITE: 'INVITE',
  LOGIN: 'LOGIN',
  HOLDING_DURATION: 'HOLDING_DURATION',
};

// Track user actions that might complete achievements
export async function trackAchievement(wallet, action, data = {}) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Find applicable achievements for this action
    const achievementsResult = await client.query(`
      SELECT * FROM achievement_types 
      WHERE trigger_action = $1 AND active = TRUE
    `, [action]);
    
    const achievements = achievementsResult.rows;
    console.log(`Found ${achievements.length} achievements for action ${action}`);
    
    // Process each relevant achievement
    for (const achievement of achievements) {
      // Check if already completed (only skip if not repeatable)
      const completedResult = await client.query(`
        SELECT * FROM user_achievements 
        WHERE wallet = $1 AND achievement_type = $2
      `, [wallet, achievement.id]);
      
      let isAlreadyCompleted = false;
      if (completedResult.rows.length > 0) {
        const completionCount = completedResult.rows[0].completion_count || 1;
        console.log(`Achievement ${achievement.id} already earned by ${wallet} (${completionCount}x)`);
        isAlreadyCompleted = true;
        
        // Skip if not repeatable
        if (!achievement.repeatable) {
          console.log(`Achievement ${achievement.id} is not repeatable, skipping`);
          continue;
        }
      }
      
      // Get current progress
      const progressResult = await client.query(`
        SELECT * FROM achievement_progress 
        WHERE wallet_address = $1 AND achievement_id = $2
      `, [wallet, achievement.id]);
      
      let progress = progressResult.rows[0];
      let currentValue = 0;
      
      if (!progress) {
        // Create new progress record
        console.log(`Creating new progress record for ${achievement.id}`);
        const insertResult = await client.query(`
          INSERT INTO achievement_progress 
          (wallet_address, achievement_id, current_value, trade_volume, trade_count, token_mint, last_updated) 
          VALUES ($1, $2, 0, 0, 0, $3, NOW())
          RETURNING *
        `, [wallet, achievement.id, data.token_mint || null]);
        
        progress = insertResult.rows[0];
      } else {
        currentValue = parseFloat(progress.current_value) || 0;
      }
      
      // Update progress based on achievement type
      let newValue = currentValue;
      
      switch (achievement.target_type) {
        case 'COUNT':
          newValue += 1;
          break;
        case 'VOLUME':
          newValue += parseFloat(data.amount || 0);
          break;
        case 'TRADES':
          // Update trade count
          await client.query(`
            UPDATE achievement_progress 
            SET trade_count = trade_count + 1
            WHERE wallet_address = $1 AND achievement_id = $2
          `, [wallet, achievement.id]);
          newValue += 1;
          break;
        case 'HOURS':
          if (data.hoursSince !== undefined) {
            newValue = 24 - data.hoursSince;
            if (newValue < 0) newValue = 0;
          }
          break;
        case 'DAYS':
          if (data.firstPurchaseDate) {
            // Store first purchase date
            await client.query(`
              UPDATE achievement_progress 
              SET first_purchase_date = $3, token_mint = $4 
              WHERE wallet_address = $1 AND achievement_id = $2
            `, [wallet, achievement.id, data.firstPurchaseDate, data.token_mint || null]);
            
            // Refresh our local progress object to get the updated first_purchase_date
            const refreshResult = await client.query(`
              SELECT * FROM achievement_progress 
              WHERE wallet_address = $1 AND achievement_id = $2
            `, [wallet, achievement.id]);
            
            if (refreshResult.rows.length > 0) {
              progress = refreshResult.rows[0];
            }
          }
          
          if (progress.first_purchase_date) {
            const now = new Date();
            const firstPurchaseDate = new Date(progress.first_purchase_date);
            const holdingDays = Math.floor((now - firstPurchaseDate) / (1000 * 60 * 60 * 24));
            newValue = holdingDays;
            console.log(`Holding days: ${holdingDays} since ${firstPurchaseDate}`);
          }
          break;
        default:
          // For other achievement types
          if (data.value !== undefined) {
            newValue = data.value;
          }
          break;
      }
      
      console.log(`Updating progress for ${achievement.id}: ${currentValue} -> ${newValue}`);
      
      // Update progress
      await client.query(`
        UPDATE achievement_progress 
        SET current_value = $3, last_updated = NOW()
        WHERE wallet_address = $1 AND achievement_id = $2
      `, [wallet, achievement.id, newValue]);
      
      // Check if achievement is completed
      if (newValue >= achievement.target_value) {
        console.log(`Achievement completed: ${achievement.id} for wallet ${wallet}`);
        
        if (isAlreadyCompleted) {
          // Increment the completion count
          await client.query(`
            UPDATE user_achievements 
            SET completion_count = completion_count + 1, 
                completed_at = NOW()
            WHERE wallet = $1 AND achievement_type = $2 AND token_mint IS NOT DISTINCT FROM $3
          `, [wallet, achievement.id, data.token_mint || null]);
          
          console.log(`Incremented completion count for ${achievement.id}`);
        } else {
          // First-time completion
          await client.query(`
            INSERT INTO user_achievements 
            (user_id, wallet, achievement_type, token_mint, completed, completed_at, completion_count)
            VALUES ($1, $2, $3, $4, TRUE, NOW(), 1)
          `, [wallet, wallet, achievement.id, data.token_mint || null]);
          
          console.log(`Recorded first completion for ${achievement.id}`);
        }
        
        // Reset progress for repeatable achievements
        if (achievement.repeatable) {
          await client.query(`
            UPDATE achievement_progress 
            SET current_value = 0
            WHERE wallet_address = $1 AND achievement_id = $2
          `, [wallet, achievement.id]);
          
          console.log(`Reset progress for repeatable achievement ${achievement.id}`);
        }
        
        // Process achievement reward
        await processAchievementReward(client, wallet, achievement);
      }
    }
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error tracking achievement:', error);
    return false;
  } finally {
    client.release();
  }
}

// Process rewards for completed achievements
async function processAchievementReward(client, wallet, achievement) {
  if (!achievement || !achievement.reward_type) return;
  
  // Handle different reward types
  switch (achievement.reward_type) {
    case 'TOKEN':
      // Add tokens to user's account
      console.log(`Processing TOKEN reward for ${wallet}: ${achievement.reward_amount}`);
      break;
    case 'BADGE':
      // Add badge to user's profile
      console.log(`Processing BADGE reward for ${wallet}: ${achievement.id}`);
      break;
    case 'FEATURE_UNLOCK':
      // Unlock a feature for the user
      console.log(`Processing FEATURE_UNLOCK for ${wallet}: ${achievement.id}`);
      break;
  }
}

// Process achievement rewards (to be implemented)
async function processAchievementRewards(wallet, achievementId) {
  try {
    // Get achievement details
    const achievementResult = await pool.query(`
      SELECT * FROM achievement_types WHERE id = $1
    `, [achievementId]);
    
    const achievement = achievementResult.rows[0];
    if (!achievement || !achievement.reward_type) return;
    
    // Handle different reward types
    switch (achievement.reward_type) {
      case 'TOKEN':
        // Add tokens to user's account
        console.log(`Processing TOKEN reward for ${wallet}: ${achievement.reward_amount}`);
        break;
      case 'BADGE':
        // Add badge to user's profile
        console.log(`Processing BADGE reward for ${wallet}: ${achievement.id}`);
        break;
      case 'FEATURE_UNLOCK':
        // Unlock a feature for the user
        console.log(`Processing FEATURE_UNLOCK for ${wallet}: ${achievement.id}`);
        break;
    }
  } catch (error) {
    console.error('Error processing achievement rewards:', error);
  }
}

// Check and update achievements after relevant user actions
export async function checkAchievements(walletAddress, action, data) {
  try {
    // Get all possible achievements
    const allAchievements = await db.achievement.findMany({
      where: { 
        active: true,
        trigger_action: action
      }
    });
    
    // Process each achievement that might be affected by this action
    for (const achievement of allAchievements) {
      await processAchievement(walletAddress, achievement, data);
    }
  } catch (error) {
    console.error('Error checking achievements:', error);
  }
}

// Process an individual achievement
async function processAchievement(walletAddress, achievement, data) {
  // Skip if user already completed this achievement
  const completed = await db.userAchievement.findFirst({
    where: {
      wallet_address: walletAddress,
      achievement_id: achievement.id,
      completed: true
    }
  });
  
  if (completed) return;
  
  // Get current progress
  let progress = await db.userAchievementProgress.findFirst({
    where: {
      wallet_address: walletAddress,
      achievement_id: achievement.id
    }
  });
  
  // Create progress record if it doesn't exist
  if (!progress) {
    progress = await db.userAchievementProgress.create({
      data: {
        wallet_address: walletAddress,
        achievement_id: achievement.id,
        current_value: 0
      }
    });
  }
  
  // Update progress based on action type
  let newValue;
  
  switch (achievement.trigger_action) {
    case ACTIONS.TRADE:
      newValue = progress.current_value + (data.tradeVolume || 1);
      break;
    case ACTIONS.DEPOSIT:
      newValue = progress.current_value + (data.depositAmount || 0);
      break;
    case ACTIONS.INVITE:
      newValue = progress.current_value + 1;
      break;
    // Add other action types as needed
    default:
      newValue = progress.current_value;
  }
  
  // Update the progress
  await db.userAchievementProgress.update({
    where: { id: progress.id },
    data: { current_value: newValue }
  });
  
  // Check if achievement is completed
  if (newValue >= achievement.target_value) {
    await completeAchievement(walletAddress, achievement.id);
  }
}

// Mark an achievement as completed
async function completeAchievement(walletAddress, achievementId) {
  try {
    await db.userAchievement.create({
      data: {
        wallet_address: walletAddress,
        achievement_id: achievementId,
        completed: true,
        completed_at: new Date()
      }
    });
    
    // Trigger any rewards for this achievement
    await processAchievementRewards(walletAddress, achievementId);
    
  } catch (error) {
    console.error('Error completing achievement:', error);
  }
} 