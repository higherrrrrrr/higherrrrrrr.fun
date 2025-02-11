import { Redis } from '@upstash/redis';
import { env } from '@/lib/env.mjs';

let redis: Redis | null = null;

export async function getRedisClient() {
  if (!env.UPSTASH_REDIS_URL || !env.UPSTASH_REDIS_TOKEN) {
    console.warn('Redis configuration not found, running without cache');
    return null;
  }

  if (!redis) {
    redis = new Redis({
      url: env.UPSTASH_REDIS_URL,
      token: env.UPSTASH_REDIS_TOKEN,
    });

    try {
      await redis.ping();
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      redis = null;
    }
  }

  return redis;
}

export async function getCacheValue<T>(key: string): Promise<T | null> {
  const redis = await getRedisClient();
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error(`Failed to get cache value for key ${key}:`, error);
    return null;
  }
}

export async function setCacheValue<T>(
  key: string, 
  value: T, 
  expirationSeconds: number = 60
): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;

  try {
    await redis.set(key, JSON.stringify(value), { ex: expirationSeconds });
  } catch (error) {
    console.error(`Failed to set cache value for key ${key}:`, error);
  }
}

export function createCacheKey(...parts: (string | number)[]): string {
  return parts.join(':');
}

export const CACHE_TIMES = {
  MINUTE: 60,
  HOUR: 3600,
  DAY: 86400,
  WEEK: 604800
} as const; 