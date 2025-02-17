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
    // Volume filters
    if (filters.minVolume && (!token.volume_24h || parseFloat(token.volume_24h) < filters.minVolume)) return false;
    if (filters.maxVolume && (!token.volume_24h || parseFloat(token.volume_24h) > filters.maxVolume)) return false;
    
    // Holders filters
    if (filters.minHolders && (!token.total_accounts || parseInt(token.total_accounts) < filters.minHolders)) return false;
    if (filters.maxHolders && (!token.total_accounts || parseInt(token.total_accounts) > filters.maxHolders)) return false;
    
    // Market Cap filters
    if (filters.minMarketCap && (!token.marketCap || parseFloat(token.marketCap) < filters.minMarketCap)) return false;
    if (filters.maxMarketCap && (!token.marketCap || parseFloat(token.marketCap) > filters.maxMarketCap)) return false;
    
    // Price change filters
    if (filters.minPriceChange24h !== null) {
      const change = parseFloat(token.priceChanges?.['24h'] || 0);
      if (isNaN(change) || change < filters.minPriceChange24h) return false;
    }
    if (filters.maxPriceChange24h !== null) {
      const change = parseFloat(token.priceChanges?.['24h'] || 0);
      if (isNaN(change) || change > filters.maxPriceChange24h) return false;
    }

    return true;
  }).sort((a, b) => {
    const sortBy = filters.sortBy || 'volume';
    const sortDir = filters.sortDir || 'desc';
    const multiplier = sortDir === 'desc' ? -1 : 1;

    const getValue = (obj, key) => {
      switch(key) {
        case 'volume': return parseFloat(obj.volume_24h || 0);
        case 'holders': return parseInt(obj.total_accounts || 0);
        case 'trades': return parseInt(obj.trades_24h || 0);
        case 'marketCap': return parseFloat(obj.marketCap || 0);
        case 'priceChange24h': return parseFloat(obj.priceChanges?.['24h'] || 0);
        default: return 0;
      }
    };

    return multiplier * (getValue(a, sortBy) - getValue(b, sortBy));
  });
} 