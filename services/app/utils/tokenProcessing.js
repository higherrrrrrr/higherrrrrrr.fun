// Helper functions
function groupSimilarTokens(tokens) {
  return tokens.reduce((acc, token) => {
    const nameKey = token.name?.toLowerCase().replace(/\s+/g, '');
    const symbolKey = token.symbol?.toLowerCase();
    const key = `${nameKey}-${symbolKey}`;
    
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(token);
    return acc;
  }, {});
}

function calculateScores(token) {
  const ageInDays = (new Date() - new Date(token.created_at)) / (1000 * 60 * 60 * 24);
  const volume = parseFloat(token.volume_24h) || 0;
  const trades = parseFloat(token.trades_24h) || 0;
  const holders = parseFloat(token.total_accounts) || 0;
  
  const ageScore = Math.min(100, (Math.log(ageInDays + 1) / Math.log(365)) * 100);
  const volumeScore = Math.min(100, (Math.log(volume + 1) / Math.log(1e6)) * 100);
  const tradesScore = Math.min(100, (Math.log(trades + 1) / Math.log(1000)) * 100);
  const holdersScore = Math.min(100, (Math.log(holders + 1) / Math.log(10000)) * 100);

  return {
    legitimacyScore: Math.round(
      (ageScore * 0.3) +
      (volumeScore * 0.3) +
      (tradesScore * 0.2) +
      (holdersScore * 0.2)
    ),
    ageInDays,
    volume,
    trades,
    holders
  };
}

function sortTokens(tokens, sortBy = 'volume') {
  return [...tokens].sort((a, b) => {
    switch (sortBy) {
      case 'relevancy':
        // Sort by legitimacy score first, then volume
        if (b.legitimacyScore !== a.legitimacyScore) {
          return b.legitimacyScore - a.legitimacyScore;
        }
        return (parseFloat(b.volume_24h) || 0) - (parseFloat(a.volume_24h) || 0);
      
      case 'volume':
        return (parseFloat(b.volume_24h) || 0) - (parseFloat(a.volume_24h) || 0);
      
      case 'trust':
        return b.legitimacyScore - a.legitimacyScore;
      
      default:
        return (parseFloat(b.volume_24h) || 0) - (parseFloat(a.volume_24h) || 0);
    }
  });
}

// Main export functions
export function processTokens(tokens, options = { sortBy: 'volume' }) {
  if (!tokens?.length) return [];
  
  const tokenGroups = groupSimilarTokens(tokens);
  
  const processedTokens = tokens.map(token => {
    try {
      const scores = calculateScores(token);
      const nameKey = token.name?.toLowerCase().replace(/\s+/g, '');
      const symbolKey = token.symbol?.toLowerCase();
      const key = `${nameKey}-${symbolKey}`;
      const duplicates = tokenGroups[key];
      const hasDuplicates = duplicates.length > 1;
      
      if (hasDuplicates) {
        duplicates.sort((a, b) => {
          const aAge = new Date(a.created_at).getTime();
          const bAge = new Date(b.created_at).getTime();
          return aAge - bAge;
        });
      }

      return {
        ...token,
        legitimacyScore: scores.legitimacyScore,
        legitimacyDetails: `Legitimacy Score: ${scores.legitimacyScore}% (based on age, volume, trades, and holders)`,
        hasDuplicates,
        isOriginal: !hasDuplicates || token === duplicates[0],
        duplicateCount: hasDuplicates ? duplicates.length - 1 : 0
      };
    } catch (error) {
      console.error('Error processing token:', token.name, error);
      return {
        ...token,
        legitimacyScore: 0,
        legitimacyDetails: 'Error calculating legitimacy score',
        hasDuplicates: false,
        isOriginal: true,
        duplicateCount: 0
      };
    }
  });

  return sortTokens(processedTokens, options.sortBy);
}

export function filterTokens(tokens, filters) {
  return tokens.filter(token => {
    const volume = parseFloat(token.volume_24h) || 0;
    const holders = parseInt(token.total_accounts || token.holder_count || token.holders || 0);
    const ageInDays = token.created_at ? 
      (Date.now() - new Date(token.created_at).getTime()) / (1000 * 60 * 60 * 24) : 
      null;

    if (filters.minVolume > 0 && volume < filters.minVolume) return false;
    if (filters.maxVolume < Infinity && volume > filters.maxVolume) return false;
    if (filters.minHolders > 0 && holders < filters.minHolders) return false;
    if (filters.maxHolders < Infinity && holders > filters.maxHolders) return false;
    if (filters.maxAge && ageInDays !== null && ageInDays > filters.maxAge) return false;

    return true;
  });
} 