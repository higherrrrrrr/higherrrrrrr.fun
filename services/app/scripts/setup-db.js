import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost/higherrrrrrr',
  ssl: false
});

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Run schema migration
    console.log('Running schema migration...');
    const schemaSql = fs.readFileSync(
      path.join(__dirname, '../migrations/001_init_schema.sql'),
      'utf8'
    );
    await client.query(schemaSql);

    // Run seed data
    console.log('Running achievement seed data...');
    const seedSql = fs.readFileSync(
      path.join(__dirname, '../migrations/002_seed_achievements.sql'),
      'utf8'
    );
    await client.query(seedSql);

    console.log('Database setup complete!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations().catch(console.error); 