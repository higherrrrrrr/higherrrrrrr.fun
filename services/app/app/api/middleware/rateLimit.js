import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { logger } from '../../../lib/logger';
import { rateLimit } from '../../../lib/rateLimit';

const WINDOW_SIZE = 15 * 60 * 1000; // 15 minutes
const LIMITS = {
  'api/achievements/check': { max: 100, window: '1m' },
  'api/achievements/leaderboard': { max: 300, window: '5m' },
  'api/achievements/stats': { max: 300, window: '5m' },
  'api/achievements/progress': { max: 300, window: '5m' },
  'api/achievements': { max: 300, window: '5m' },
  'default': { max: 1000, window: '15m' }
};

export async function rateLimitMiddleware(request) {
  const path = new URL(request.url).pathname;
  
  // Find most specific matching path
  const matchingPaths = Object.entries(LIMITS)
    .filter(([key]) => key !== 'default' && path.includes(key))
    .sort((a, b) => b[0].length - a[0].length);

  const limit = matchingPaths.length > 0 
    ? matchingPaths[0][1]  // Most specific match
    : LIMITS.default;      // Fallback to default

  return rateLimit(request, limit);
}

export async function rateLimiter(request) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    const path = new URL(request.url).pathname;
    
    const limit = Object.entries(LIMITS).find(([key]) => 
      path.startsWith(key) || key === 'default'
    )[1];

    // Use a client with timeout
    const client = await pool.connect();
    try {
      const result = await client.query(
        `INSERT INTO rate_limits (ip, path, requests, window_start)
         VALUES ($1, $2, 1, CURRENT_TIMESTAMP)
         ON CONFLICT (ip, path) DO UPDATE SET
           requests = CASE 
             WHEN rate_limits.window_start < NOW() - INTERVAL '15 minutes'
             THEN 1
             ELSE rate_limits.requests + 1
           END,
           window_start = CASE 
             WHEN rate_limits.window_start < NOW() - INTERVAL '15 minutes'
             THEN CURRENT_TIMESTAMP
             ELSE rate_limits.window_start
           END
         RETURNING requests`,
        [ip, path]
      );

      if (result.rows[0].requests > limit) {
        return NextResponse.json(
          { error: 'Too many requests, please try again later.' },
          { status: 429 }
        );
      }
    } finally {
      client.release();
    }
    
    return null;
  } catch (error) {
    logger.error('Rate limiting error:', error);
    return null; // Fail open if rate limiting fails
  }
} 