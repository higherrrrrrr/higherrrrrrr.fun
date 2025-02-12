import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { processTokens } from '../utils/tokenProcessing';

const fetcher = url => fetch(url).then(res => res.json());

// Preset filter configurations
const PRESET_FILTERS = {
  newAndRising: {
    name: "New & Rising",
    filters: {
      maxAge: 7, // Only tokens created in last 7 days
      minVolume: 1000, // Minimum $1k volume
      minHolders: 100, // At least 100 holders
      sortBy: 'volume',
      sortDir: 'desc'
    }
  },
  whaleActivity: {
    name: "Whale Activity",
    filters: {
      minVolume: 100000, // Minimum $100k volume
      minTransactionSize: 10000, // Minimum $10k per trade
      sortBy: 'volume',
      sortDir: 'desc'
    }
  },
  communityFavorite: {
    name: "Community Favorite",
    filters: {
      minHolders: 1000, // At least 1k holders
      minAge: 30, // At least 30 days old
      sortBy: 'holders',
      sortDir: 'desc'
    }
  },
  highVolume: {
    name: "High Volume",
    filters: {
      minVolume: 500000, // Minimum $500k volume
      minTrades: 1000, // At least 1k trades
      sortBy: 'volume',
      sortDir: 'desc'
    }
  }
};

export function useTokenFilter() {
  const [filters, setFilters] = useState({
    minVolume: 0,
    maxVolume: Infinity,
    minHolders: 0,
    maxHolders: Infinity,
    minTransactionSize: 0,
    minTrades: 0,
    minAge: null,
    maxAge: null,
    sortBy: 'volume',
    sortDir: 'desc',
    category: null,
    preset: null,
    page: 1,
    perPage: 12
  });

  // Create query string from filters
  const queryString = useCallback(() => {
    const params = new URLSearchParams();
    
    if (filters.minVolume > 0) params.set('minVolume', filters.minVolume);
    if (filters.maxVolume < Infinity) params.set('maxVolume', filters.maxVolume);
    if (filters.minHolders > 0) params.set('minHolders', filters.minHolders);
    if (filters.maxHolders < Infinity) params.set('maxHolders', filters.maxHolders);
    if (filters.minTransactionSize > 0) params.set('minTransactionSize', filters.minTransactionSize);
    if (filters.minTrades > 0) params.set('minTrades', filters.minTrades);
    if (filters.minAge) params.set('minAge', filters.minAge);
    if (filters.maxAge) params.set('maxAge', filters.maxAge);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortDir) params.set('sortDir', filters.sortDir);
    if (filters.category) params.set('category', filters.category);
    params.set('page', filters.page);
    params.set('perPage', filters.perPage);
    
    return params.toString();
  }, [filters]);

  // Fetch filtered data with cache invalidation on filter change
  const { data, error, isLoading, mutate } = useSWR(
    `/api/tokens/filter?${queryString()}`,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
      refreshInterval: 30000,
    }
  );

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      // Always reset page when any filter changes (except page itself)
      const shouldResetPage = Object.keys(newFilters).some(key => 
        key !== 'page' && newFilters[key] !== prev[key]
      );

      const updatedFilters = {
        ...prev,
        ...newFilters,
        page: shouldResetPage ? 1 : (newFilters.page || prev.page),
        perPage: 12
      };

      // Force immediate refresh when category changes
      if (newFilters.category && newFilters.category !== prev.category) {
        mutate();
      }
      return updatedFilters;
    });
  }, [mutate]);

  // Apply preset filter
  const applyPreset = useCallback((presetName) => {
    if (!presetName) {
      setFilters({
        minVolume: 0,
        maxVolume: Infinity,
        minHolders: 0,
        maxHolders: Infinity,
        minTransactionSize: 0,
        minTrades: 0,
        minAge: null,
        maxAge: null,
        sortBy: 'volume',
        sortDir: 'desc',
        category: null,
        preset: null,
        page: 1,
        perPage: 12
      });
      return;
    }

    const preset = PRESET_FILTERS[presetName];
    if (preset) {
      setFilters(prev => ({
        ...prev,
        ...preset.filters,
        preset: presetName,
        page: 1
      }));
    }
  }, []);

  return {
    tokens: data?.tokens ? processTokens(data.tokens, { sortBy: filters.sortBy }) : [],
    totalPages: Math.ceil((data?.total || 0) / filters.perPage),
    currentPage: filters.page,
    error,
    isLoading,
    filters,
    updateFilters,
    updatePage: (newPage) => updateFilters({ page: newPage }),
    applyPreset,
    presets: PRESET_FILTERS,
    refresh: mutate
  };
} 