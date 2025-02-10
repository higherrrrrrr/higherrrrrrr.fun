import { NextResponse } from 'next/server';
import { getHeliusTokenData } from '@/lib/helius';

export async function GET() {
  try {
    const tokens = await getHeliusTokenData();
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Failed to fetch token data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch token data' },
      { status: 500 }
    );
  }
} 