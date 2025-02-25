import pool from '../models/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env.local');

try {
  dotenv.config({ path: envPath });
} catch (err) {
  console.error('Error loading .env.local:', err);
  process.exit(1);
}

async function seedAchievementTypes() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Add achievement types for testing
    await client.query(`
      INSERT INTO achievement_types 
      (id, name, description, icon, target_value, target_type, trigger_action, reward_type, reward_amount, active, repeatable)
      VALUES 
        ('FREQUENT_TRADER', 'Frequent Trader', 'Complete 5 trades', '🔄', 5, 'TRADES', 'TRADE', 'BADGE', 0, TRUE, TRUE),
        ('HIGH_VOLUME_TRADER', 'High Volume Trader', 'Trade more than 10,000 tokens', '💰', 10000, 'VOLUME', 'TRADE', 'TOKEN', 100, TRUE, TRUE),
        ('EARLY_BUYER', 'Early Buyer', 'Buy tokens within 24 hours of listing', '🚀', 20, 'HOURS', 'PURCHASE', 'BADGE', 0, TRUE, FALSE),
        ('WHALE', 'Whale', 'Deposit more than 10,000 tokens', '🐋', 10000, 'VOLUME', 'DEPOSIT', 'FEATURE_UNLOCK', 0, TRUE, TRUE),
        ('DIAMOND_HANDS', 'Diamond Hands', 'Hold tokens for more than 30 days', '💎', 30, 'DAYS', 'HOLDING_DURATION', 'BADGE', 0, TRUE, FALSE)
      ON CONFLICT (id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        icon = EXCLUDED.icon,
        target_value = EXCLUDED.target_value,
        target_type = EXCLUDED.target_type,
        trigger_action = EXCLUDED.trigger_action,
        reward_type = EXCLUDED.reward_type,
        reward_amount = EXCLUDED.reward_amount,
        repeatable = EXCLUDED.repeatable,
        active = TRUE
    `);
    
    await client.query('COMMIT');
    console.log('✅ Test achievement types have been added successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding achievement types:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAchievementTypes(); 