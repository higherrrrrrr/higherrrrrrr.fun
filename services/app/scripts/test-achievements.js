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

async function testAchievements() {
  try {
    console.log('Starting achievement tests...');
    
    // 1. Test trade action (multiple times for FREQUENT_TRADER)
    console.log('\n--- Testing TRADE action (multiple times) ---');
    for (let i = 0; i < 5; i++) {
      await trackAchievement(TEST_WALLET, ACTIONS.TRADE, {
        amount: 100,
        token_mint: TEST_TOKEN
      });
    }
    
    // 2. Test purchase action (Early Buyer)
    console.log('\n--- Testing PURCHASE action ---');
    await trackAchievement(TEST_WALLET, ACTIONS.PURCHASE, {
      amount: 100,
      token_mint: TEST_TOKEN,
      hoursSince: 12 // Within 24h window
    });
    
    // 3. Test deposit action (Whale achievement)
    console.log('\n--- Testing DEPOSIT action ---');
    await trackAchievement(TEST_WALLET, ACTIONS.DEPOSIT, {
      amount: 5000,
      token_mint: TEST_TOKEN
    });
    
    // 4. Test holding duration
    console.log('\n--- Testing HOLDING_DURATION action ---');
    await trackAchievement(TEST_WALLET, ACTIONS.HOLDING_DURATION, {
      firstPurchaseDate: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days ago
      token_mint: TEST_TOKEN
    });
    
    // 5. Get user achievements and progress
    console.log('\n--- Fetching results ---');
    const achievements = await getUserAchievements(TEST_WALLET);
    const progress = await getAchievementProgress(TEST_WALLET);
    
    console.log('Completed Achievements:');
    console.log(JSON.stringify(achievements, null, 2));
    
    console.log('\nAchievement Progress:');
    console.log(JSON.stringify(progress, null, 2));
    
    console.log('\nTests completed successfully');
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await pool.end();
  }
}

testAchievements(); 