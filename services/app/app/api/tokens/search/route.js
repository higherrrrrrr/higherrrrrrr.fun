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

    // Group tokens by similar names/symbols
    const tokenGroups = [...major, ...meme, ...vc].reduce((acc, token) => {
      const nameKey = token.name?.toLowerCase().replace(/\s+/g, '');
      const symbolKey = token.symbol?.toLowerCase();
      const key = `${nameKey}-${symbolKey}`;
      
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(token);
      return acc;
    }, {});

    // Process each group to identify legitimate tokens
    const processedTokens = Object.values(tokenGroups).flatMap(group => {
      if (group.length === 1) {
        return [{ ...group[0], hasDuplicates: false }];
      }

      // Calculate legitimacy score for each token
      const scoredTokens = group.map(token => {
        const ageInDays = (new Date() - new Date(token.created_at)) / (1000 * 60 * 60 * 24);
        const volume = parseFloat(token.volume_24h) || 0;
        const trades = parseFloat(token.trades_24h) || 0;
        const holders = parseFloat(token.total_accounts) || 0;
        
        // Calculate individual component scores (0-100)
        const ageScore = Math.min(100, (Math.log(ageInDays + 1) / Math.log(365)) * 100); // Max age score at 1 year
        const volumeScore = Math.min(100, (Math.log(volume + 1) / Math.log(1e6)) * 100); // Max volume score at 1M
        const tradesScore = Math.min(100, (Math.log(trades + 1) / Math.log(1000)) * 100); // Max trades score at 1000
        const holdersScore = Math.min(100, (Math.log(holders + 1) / Math.log(10000)) * 100); // Max holders score at 10K

        // Weighted average of all components
        const legitimacyScore = Math.round(
          (ageScore * 0.3) +      // 30% weight for age
          (volumeScore * 0.3) +   // 30% weight for volume
          (tradesScore * 0.2) +   // 20% weight for trades
          (holdersScore * 0.2)    // 20% weight for holders
        );
        
        return {
          ...token,
          legitimacyScore
        };
      });

      // Sort by legitimacy score
      const sortedTokens = scoredTokens.sort((a, b) => 
        b.legitimacyScore - a.legitimacyScore
      );

      const primaryToken = sortedTokens[0];
      
      const tokenDate = new Date(primaryToken.created_at);
      const primaryDate = new Date(primaryToken.created_at);
      const timeDiffMs = tokenDate - primaryDate;
      
      return sortedTokens.map((token, index) => ({
        ...token,
        hasDuplicates: true,
        isOriginal: index === 0,
        duplicateCount: sortedTokens.length - 1,
        launchedAfter: timeDiffMs > 0 ? calculateTimeDiff(timeDiffMs) : null,
        legitimacyDetails: `Legitimacy Score: ${token.legitimacyScore}% (based on age, volume, trades, and holders)`
      }));
    });

    // Filter and sort results with updated priority
    const searchResults = processedTokens
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
        const volumeDiff = (parseFloat(b.volume_24h) || 0) - (parseFloat(a.volume_24h) || 0);
        if (Math.abs(volumeDiff) > 1000) return volumeDiff;

        // 4. Sort by legitimacy score
        return (b.legitimacyScore || 0) - (a.legitimacyScore || 0);
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