// Script to inspect database schema
import pkg from 'pg';
const { Pool } = pkg;
import { config } from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try to load environment variables from .env.local first, then fall back to .env
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');

// Check which env file exists
if (fs.existsSync(envLocalPath)) {
  console.log('Loading environment from .env.local');
  config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  console.log('Loading environment from .env');
  config({ path: envPath });
} else {
  console.warn('No .env or .env.local file found. Relying on environment variables.');
  config();
}

// Validate DATABASE_URL exists
if (!process.env.DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Make sure your .env.local or .env file exists and contains DATABASE_URL.');
  process.exit(1);
}

// Log database URL (hiding password)
const dbUrlForLogging = process.env.DATABASE_URL.replace(
  /postgres:\/\/([^:]+):([^@]+)@/,
  'postgres://$1:****@'
);
console.log(`Connecting to database: ${dbUrlForLogging}`);

// Create database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

async function checkSchema() {
  try {
    console.log('Checking database schema...');
    
    // Check trades table
    const tradesSchema = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'trades'
      ORDER BY ordinal_position
    `);
    
    console.log('TRADES TABLE COLUMNS:');
    tradesSchema.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });
    
    // Check positions table
    const positionsSchema = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'positions'
      ORDER BY ordinal_position
    `);
    
    console.log('\nPOSITIONS TABLE COLUMNS:');
    positionsSchema.rows.forEach(col => {
      console.log(`${col.column_name}: ${col.data_type}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error checking schema:', error);
    process.exit(1);
  }
}

checkSchema(); 