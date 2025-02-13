import { NextResponse } from 'next/server';
import tokenCache from '../../../../services/tokens';

export async function GET() {
  try {
    // Get all categories at once
    const [major, meme, vc] = await Promise.all([
      tokenCache.getMajorTokens(),
      tokenCache.getMemeTokens(),
      tokenCache.getVCBackedTokens()
    ]);

    return NextResponse.json({
      major,
      meme,
      vc
    });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
} 