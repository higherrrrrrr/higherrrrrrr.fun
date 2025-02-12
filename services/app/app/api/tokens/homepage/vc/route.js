import { NextResponse } from 'next/server';
import tokenCache from '../../../../../cache/tokens';

export async function GET() {
  try {
    const tokens = await tokenCache.getVCBackedTokens();
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Error fetching VC tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch VC tokens' },
      { status: 500 }
    );
  }
} 