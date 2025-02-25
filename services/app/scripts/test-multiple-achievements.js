import { trackAchievement, ACTIONS } from '../lib/achievements.js';
import { getUserAchievements, getAchievementProgress } from '../models/achievements.js';
import pool from '../models/db.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env.local');

try {
  dotenv.config({ path: envPath });
} catch (err) {
  console.error('Error loading .env.local:', err);
  process.exit(1);
}

// Test wallet
const TEST_WALLET = 'TestWallet123456789';
const TEST_TOKEN = 'TestToken123';

async function testMultipleAchievements() {
  try {
    console.log('Starting multiple achievement test...');
    
    // Complete FREQUENT_TRADER twice (it's repeatable)
    console.log('\n--- First completion of FREQUENT_TRADER ---');
    for (let i = 0; i < 5; i++) {
      await trackAchievement(TEST_WALLET, ACTIONS.TRADE, {
        amount: 100,
        token_mint: TEST_TOKEN
      });
    }
    
    console.log('\n--- Second completion of FREQUENT_TRADER ---');
    for (let i = 0; i < 5; i++) {
      await trackAchievement(TEST_WALLET, ACTIONS.TRADE, {
        amount: 100,
        token_mint: TEST_TOKEN
      });
    }
    
    // Complete WHALE (also repeatable)
    console.log('\n--- First completion of WHALE ---');
    await trackAchievement(TEST_WALLET, ACTIONS.DEPOSIT, {
      amount: 10000,
      token_mint: TEST_TOKEN
    });
    
    console.log('\n--- Second completion of WHALE ---');
    await trackAchievement(TEST_WALLET, ACTIONS.DEPOSIT, {
      amount: 10000,
      token_mint: TEST_TOKEN
    });
    
    // Attempt DIAMOND_HANDS twice (not repeatable)
    console.log('\n--- Testing non-repeatable DIAMOND_HANDS ---');
    await trackAchievement(TEST_WALLET, ACTIONS.HOLDING_DURATION, {
      firstPurchaseDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
      token_mint: TEST_TOKEN
    });
    
    await trackAchievement(TEST_WALLET, ACTIONS.HOLDING_DURATION, {
      firstPurchaseDate: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000), // 40 days ago
      token_mint: TEST_TOKEN
    });
    
    // Get user achievements and check counts
    console.log('\n--- Fetching results ---');
    const achievements = await getUserAchievements(TEST_WALLET);
    
    console.log('Completed Achievements with counts:');
    achievements.forEach(achievement => {
      console.log(`${achievement.achievement_type}: ${achievement.completion_count}x`);
    });
    
    console.log('\nTests completed successfully');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await pool.end();
  }
}

testMultipleAchievements(); 