import { NextResponse } from 'next/server';
import tokenCache from '../../../../cache/tokens';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.toLowerCase() || '';

    // Get all tokens with their original categories
    const [major, meme, vc] = await Promise.all([
      tokenCache.getMajorTokens().then(tokens => tokens.map(t => ({ ...t, category: 'major' }))),
      tokenCache.getMemeTokens().then(tokens => tokens.map(t => ({ ...t, category: 'meme' }))),
      tokenCache.getVCBackedTokens().then(tokens => tokens.map(t => ({ ...t, category: 'vc' })))
    ]);

    // Filter and sort results
    const searchResults = [...major, ...meme, ...vc]
      .filter(token => 
        token.name?.toLowerCase().includes(query) ||
        token.symbol?.toLowerCase().includes(query) ||
        token.token_address?.toLowerCase().includes(query)
      )
      .sort((a, b) => {
        // 1. Sort by exact match first
        const aExactMatch = 
          a.name?.toLowerCase() === query || 
          a.symbol?.toLowerCase() === query;
        const bExactMatch = 
          b.name?.toLowerCase() === query || 
          b.symbol?.toLowerCase() === query;
        if (aExactMatch !== bExactMatch) return aExactMatch ? -1 : 1;

        // 2. Sort by starts with query
        const aStartsWith = 
          a.name?.toLowerCase().startsWith(query) || 
          a.symbol?.toLowerCase().startsWith(query);
        const bStartsWith = 
          b.name?.toLowerCase().startsWith(query) || 
          b.symbol?.toLowerCase().startsWith(query);
        if (aStartsWith !== bStartsWith) return aStartsWith ? -1 : 1;

        // 3. Sort by volume
        return (parseFloat(b.volume_24h) || 0) - (parseFloat(a.volume_24h) || 0);
      });

    return NextResponse.json({
      results: searchResults,
      count: searchResults.length
    });
  } catch (error) {
    console.error('Error searching tokens:', error);
    return NextResponse.json(
      { error: 'Failed to search tokens' },
      { status: 500 }
    );
  }
}

function calculateTimeDiff(diffMs) {
  // Convert to absolute value for the calculation
  diffMs = Math.abs(diffMs);
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffMonths / 12);

  if (diffYears > 0) {
    return `${diffYears} year${diffYears > 1 ? 's' : ''}`;
  } else if (diffMonths > 0) {
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
  } else if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else {
    return 'the same day as';
  }
} 