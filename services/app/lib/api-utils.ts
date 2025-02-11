import { Redis } from '@upstash/redis';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Initialize Redis client
export const redis = process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_URL,
      token: process.env.UPSTASH_REDIS_TOKEN,
    })
  : null;

// Initialize OpenAI client
export const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Helper function for Redis caching
export async function getFromCache<T>(key: string): Promise<T | null> {
  if (!redis) return null;
  return redis.get(key);
}

export async function setCache<T>(key: string, data: T, expirationSeconds: number = 300): Promise<void> {
  if (!redis) return;
  await redis.set(key, data, { ex: expirationSeconds });
}

// Helper for Helius API calls
export async function fetchHelius(endpoint: string, body: any) {
  const response = await fetch(
    `https://api.helius.xyz/v0/${endpoint}?api-key=${process.env.HELIUS_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }
  );

  if (!response.ok) {
    throw new Error('Helius API request failed');
  }

  return response.json();
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

export function createApiResponse<T>({ 
  data, 
  error, 
  status = 200 
}: ApiResponse<T>) {
  const response = {
    status,
    ...(data && { data }),
    ...(error && { error })
  };

  // Log errors but not in test environment
  if (error && process.env.NODE_ENV !== 'test') {
    console.error('API Error:', { status, error });
  }

  return NextResponse.json(response, { status });
}

export function handleApiError(error: unknown, defaultMessage = 'Internal server error') {
  console.error('API Error:', error);

  const message = error instanceof Error ? error.message : defaultMessage;
  
  return createApiResponse({
    error: message,
    status: 500,
    data: null
  });
}

export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  errorMessage = 'Operation failed'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : errorMessage
    );
  }
}

export function validateAddress(address: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
} 