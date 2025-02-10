import { Redis } from '@upstash/redis';
import { env } from './env.mjs';

// Temporarily disable Redis until we can fix authentication
export function getRedisClient() {
  return null;
}

// Export without Redis for now
export const redis = null; 