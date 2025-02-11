import { NextResponse } from 'next/server';
import { getTokenMetadata } from '@/lib/helius';
import { env } from '@/lib/env.mjs';

export async function GET(
  request: Request,
  context: { params: { address: string } }
) {
  try {
    const { address } = context.params;
    const metadata = await getTokenMetadata(address);
    
    if (!metadata) {
      return NextResponse.json({ error: 'Token not found' }, { status: 404 });
    }

    return NextResponse.json({ data: metadata });
  } catch (error) {
    console.error('Failed to fetch token state:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token state' },
      { status: 500 }
    );
  }
} 