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

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export function createApiResponse<T>(response: ApiResponse<T>) {
  return NextResponse.json(
    {
      data: response.data,
      error: response.error,
      timestamp: Date.now()
    },
    { status: response.status }
  );
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);
  
  if (error instanceof ZodError) {
    return createApiResponse({
      error: 'Validation error',
      status: 400
    });
  }

  return createApiResponse({
    error: 'Internal server error',
    status: 500
  });
} 