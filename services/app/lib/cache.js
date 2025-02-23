import pool from './db';

export const cache = {
  async get(key) {
    const result = await pool.query(
      `DELETE FROM cache WHERE expires_at < NOW();
       SELECT value FROM cache WHERE key = $1`,
      [key]
    );
    return result.rows[0]?.value || null;
  },

  async set(key, value, ttl = 300) {
    await pool.query(
      `INSERT INTO cache (key, value, expires_at)
       VALUES ($1, $2, NOW() + interval '1 second' * $3)
       ON CONFLICT (key) DO UPDATE
       SET value = $2, expires_at = NOW() + interval '1 second' * $3`,
      [key, value, ttl]
    );
  }
}; 