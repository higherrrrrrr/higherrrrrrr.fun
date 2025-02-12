import { useState, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { processTokens } from '../utils/tokenProcessing';

export function useTokenSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('relevancy');
  const perPage = 12;

  const calculateSearchRelevancy = useCallback((token, searchQuery) => {
    const searchLower = searchQuery.toLowerCase();
    const nameLower = token.name?.toLowerCase() || '';
    const symbolLower = token.symbol?.toLowerCase() || '';
    const addressLower = token.address?.toLowerCase() || '';

    // Start with a base score
    let score = 0;

    // Exact matches get highest boost
    if (symbolLower === searchLower) score += 100;
    if (nameLower === searchLower) score += 90;
    if (addressLower === searchLower) score += 80;

    // Starts with matches get medium boost
    else if (symbolLower.startsWith(searchLower)) score += 70;
    else if (nameLower.startsWith(searchLower)) score += 60;
    else if (addressLower.startsWith(searchLower)) score += 50;

    // Contains matches get small boost
    else if (symbolLower.includes(searchLower)) score += 40;
    else if (nameLower.includes(searchLower)) score += 30;
    else if (addressLower.includes(searchLower)) score += 20;

    // Penalize duplicates unless they're the original
    if (token.hasDuplicates && !token.isOriginal) {
      score *= 0.5;
    }

    return score;
  }, []);

  const searchTokens = useCallback((tokens, searchQuery) => {
    if (!tokens || !searchQuery) return tokens;
    
    const searchLower = searchQuery.toLowerCase();
    
    // First process tokens to handle duplicates and base scoring
    const processedTokens = processTokens(tokens, { sortBy: 'relevancy' });
    
    // Then filter and add search relevancy
    return processedTokens
      .filter(token => 
        token.name?.toLowerCase().includes(searchLower) ||
        token.symbol?.toLowerCase().includes(searchLower) ||
        token.address?.toLowerCase().includes(searchLower)
      )
      .map(token => ({
        ...token,
        searchRelevancy: calculateSearchRelevancy(token, searchQuery)
      }))
      .sort((a, b) => {
        // Sort by search relevancy first
        if (b.searchRelevancy !== a.searchRelevancy) {
          return b.searchRelevancy - a.searchRelevancy;
        }
        
        // Then by volume
        const volumeA = parseFloat(a.volume_24h) || 0;
        const volumeB = parseFloat(b.volume_24h) || 0;
        if (volumeB !== volumeA) {
          return volumeB - volumeA;
        }
        
        // Finally by legitimacy score
        return b.legitimacyScore - a.legitimacyScore;
      });
  }, [calculateSearchRelevancy]);

  const handleSearch = useCallback((value) => {
    setQuery(value);
    setPage(1);
    setIsLoading(true);
    setError(null);
    // Don't clear other states
    setIsLoading(false);
  }, []);

  return {
    query,
    results,
    searchTokens,
    isLoading,
    error,
    sortBy,
    setSortBy,
    handleSearch,
    page,
    perPage,
    updatePage: setPage,
    clearSearch: () => {
      setQuery('');
      setResults(null);
      setError(null);
      setPage(1);
    }
  };
} 