import pkg from 'pg';
const { Pool } = pkg;
import config from '../config/config.js';

const pool = new Pool({
  connectionString: config.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully');
  }
});

export default pool;