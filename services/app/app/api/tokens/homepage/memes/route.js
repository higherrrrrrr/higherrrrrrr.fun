import { NextResponse } from 'next/server';
import tokenCache from '../../../../../cache/tokens';

export async function GET() {
  try {
    const tokens = await tokenCache.getMemeTokens();
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Error fetching meme tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch meme tokens' },
      { status: 500 }
    );
  }
} 