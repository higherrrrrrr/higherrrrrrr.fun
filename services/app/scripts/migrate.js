import fs from 'fs/promises';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = path.join(__dirname, '../.env.local');

try {
  dotenv.config({ path: envPath });
} catch (err) {
  console.error('Error loading .env.local:', err);
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../migrations');
  
  try {
    // Check if migrations directory exists
    await fs.access(migrationsDir);
  } catch (err) {
    console.error(`Migrations directory not found at: ${migrationsDir}`);
    console.error('Please create the directory and add your .sql migration files');
    process.exit(1);
  }
  
  // Update the file filtering to explicitly look for .sql files
  const files = await fs.readdir(migrationsDir);
  
  if (files.length === 0) {
    console.error('No migration files found');
    process.exit(1);
  }
  
  // filter + sort them, ensuring we only process .sql files
  const sqlFiles = files
    .filter(f => f.endsWith('.sql'))
    .sort((a, b) => {
      // Extract numeric prefix if it exists (e.g., "001_", "002_")
      const aNum = parseInt(a.match(/^(\d+)/)?.[1] || '0');
      const bNum = parseInt(b.match(/^(\d+)/)?.[1] || '0');
      return aNum - bNum;
    });

  console.log(`Found ${sqlFiles.length} migration files to run`);
  
  // Run migrations in sequence
  for (const file of sqlFiles) {
    const filePath = path.join(migrationsDir, file);
    console.log(`Running migration: ${file}`);
    
    try {
      const sql = await fs.readFile(filePath, 'utf8');
      await pool.query(sql);
      console.log(`Successfully completed migration: ${file}`);
    } catch (err) {
      console.error(`Error running migration ${file}:`, err);
      process.exit(1);
    }
  }
  
  console.log('Migrations complete!');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
}); 