import pool from '../lib/db';

export const executeTransaction = async (queries) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    
    for (const q of queries) {
      const result = await client.query(q.text, q.values);
      results.push(result);
    }
    
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}; 