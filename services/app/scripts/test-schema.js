#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.local') });

// Create database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function testSchema() {
  try {
    console.log('🧪 Testing database schema...');
    
    // Check if trades table exists
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'trades'
      );
    `);
    
    const tradesTableExists = tableResult.rows[0].exists;
    
    if (tradesTableExists) {
      console.log('✅ Trades table exists');
      
      // Check table structure
      const columnsResult = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'trades'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Trades table structure:');
      columnsResult.rows.forEach(column => {
        console.log(`   - ${column.column_name} (${column.data_type})`);
      });
      
      // Check indexes
      const indexesResult = await pool.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'trades';
      `);
      
      console.log('🔍 Trades table indexes:');
      indexesResult.rows.forEach(index => {
        console.log(`   - ${index.indexname}`);
      });
    } else {
      console.error('❌ Trades table does not exist');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await pool.end();
  }
}

testSchema().catch(console.error); 