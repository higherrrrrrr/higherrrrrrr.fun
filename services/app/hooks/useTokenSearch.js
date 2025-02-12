import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';

export function useTokenSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery) => {
      if (!searchQuery.trim()) {
        setResults(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/tokens/search?q=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Search failed');
        
        const data = await response.json();
        setResults(data.results);
      } catch (err) {
        console.error('Search error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handle search input changes
  const handleSearch = useCallback((searchQuery) => {
    setQuery(searchQuery);
    debouncedSearch(searchQuery);
  }, [debouncedSearch]);

  return {
    query,
    results,
    isLoading,
    error,
    handleSearch,
    clearSearch: () => {
      setQuery('');
      setResults(null);
    }
  };
} 