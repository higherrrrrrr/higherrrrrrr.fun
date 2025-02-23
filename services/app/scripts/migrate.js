import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.local' });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost/higherrrrrrr',
  ssl: false
});

async function migrate() {
  const client = await pool.connect();
  try {
    // Run migrations
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/001_init_schema.sql'),
      'utf8'
    );
    await client.query(migrationSQL);
    
    // Run seeds
    const seedSQL = fs.readFileSync(
      path.join(__dirname, '../migrations/002_seed_achievements.sql'),
      'utf8'
    );
    await client.query(seedSQL);
    
    console.log('Migration completed successfully');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error); 