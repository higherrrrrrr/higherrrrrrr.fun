// CommonJS version
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') });
const { Pool } = require('pg');

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('🗑️ Resetting database...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Truncate all tables
    await client.query('TRUNCATE TABLE trades CASCADE');
    await client.query('TRUNCATE TABLE positions CASCADE');
    await client.query('TRUNCATE TABLE user_stats CASCADE');
    
    // Keep token_metadata as it's valuable cache
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('✅ Database reset complete');
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the reset
resetDatabase(); 