import { NextResponse } from 'next/server';
import tokenCache from '../../../../../services/tokens';

export async function GET() {
  try {
    const tokens = await tokenCache.getMajorTokens();
    return NextResponse.json({ tokens });
  } catch (error) {
    console.error('Error fetching major tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch major tokens' },
      { status: 500 }
    );
  }
}
