import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from './lib/redis';
import { validateEnv } from '@/lib/env';

const RATE_LIMIT = 100; // requests per minute
const WINDOW_SIZE = 60; // 1 minute in seconds

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Add CORS headers
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 200, headers: response.headers });
  }

  // Add Helius RPC URL to requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-helius-rpc', process.env.HELIUS_RPC_URL || '');
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Skip rate limiting for now
  return response;
}

export const config = {
  matcher: '/api/:path*'
}; 