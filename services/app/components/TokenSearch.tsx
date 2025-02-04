import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TokenData } from '../types';

interface TokenSearchProps {
  onTokenSelect?: (token: TokenData) => void;
}

type SortField = 'marketCap' | 'volume24h' | 'holdersCount' | 'launchDate';
type SortDirection = 'asc' | 'desc';

export default function TokenSearch({ onTokenSelect }: TokenSearchProps) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search and filter states
  const [search, setSearch] = useState('');
  const [marketCapMin, setMarketCapMin] = useState<string>('');
  const [marketCapMax, setMarketCapMax] = useState<string>('');
  const [distributionFilter, setDistributionFilter] = useState<'excellent' | 'fair' | 'sketch' | ''>('');

  // Sorting states
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {
          search: search || undefined,
          marketCapMin: marketCapMin ? parseFloat(marketCapMin) : undefined,
          marketCapMax: marketCapMax ? parseFloat(marketCapMax) : undefined,
          distributionCategory: distributionFilter || undefined,
          sortBy: sortField,
          sortDirection,
          page,
          limit: ITEMS_PER_PAGE
        };

        // Use your existing API function
        const response = await fetch(`/api/tokens?${new URLSearchParams(params as any)}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch tokens');
        }

        setTokens(data.tokens);
        setTotalPages(Math.ceil(data.total / ITEMS_PER_PAGE));
      } catch (err) {
        setError('Failed to fetch tokens');
        console.error('Error fetching tokens:', err);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchTokens, 300);
    return () => clearTimeout(timeoutId);
  }, [search, marketCapMin, marketCapMax, distributionFilter, sortField, sortDirection, page]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
    setPage(1); // Reset to first page when sorting changes
  };

  return (
    <div className="p-4">
      <div className="mb-6 space-y-4">
        {/* Search input */}
        <input
          type="text"
          placeholder="Search by name, symbol, or address"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border border-green-500/30 rounded bg-black text-green-500 focus:border-green-500/60 focus:outline-none"
        />

        {/* Filter controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="number"
            placeholder="Min Market Cap"
            value={marketCapMin}
            onChange={(e) => setMarketCapMin(e.target.value)}
            className="p-2 border border-green-500/30 rounded bg-black text-green-500 focus:border-green-500/60 focus:outline-none"
          />
          <input
            type="number"
            placeholder="Max Market Cap"
            value={marketCapMax}
            onChange={(e) => setMarketCapMax(e.target.value)}
            className="p-2 border border-green-500/30 rounded bg-black text-green-500 focus:border-green-500/60 focus:outline-none"
          />
          <select
            value={distributionFilter}
            onChange={(e) => setDistributionFilter(e.target.value as any)}
            className="p-2 border border-green-500/30 rounded bg-black text-green-500 focus:border-green-500/60 focus:outline-none"
          >
            <option value="">All Distributions</option>
            <option value="excellent">Excellent</option>
            <option value="fair">Fair</option>
            <option value="sketch">Sketch</option>
          </select>
        </div>

        {/* Sort controls */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleSort('marketCap')}
            className={`px-3 py-1 rounded border border-green-500/30 text-sm ${
              sortField === 'marketCap' ? 'bg-green-500/20' : ''
            }`}
          >
            Market Cap {sortField === 'marketCap' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('volume24h')}
            className={`px-3 py-1 rounded border border-green-500/30 text-sm ${
              sortField === 'volume24h' ? 'bg-green-500/20' : ''
            }`}
          >
            Volume {sortField === 'volume24h' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('holdersCount')}
            className={`px-3 py-1 rounded border border-green-500/30 text-sm ${
              sortField === 'holdersCount' ? 'bg-green-500/20' : ''
            }`}
          >
            Holders {sortField === 'holdersCount' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => handleSort('launchDate')}
            className={`px-3 py-1 rounded border border-green-500/30 text-sm ${
              sortField === 'launchDate' ? 'bg-green-500/20' : ''
            }`}
          >
            Launch Date {sortField === 'launchDate' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {/* Loading and error states */}
      {loading && <div className="text-center text-green-500">Loading...</div>}
      {error && <div className="text-red-500 text-center">{error}</div>}

      {/* Token list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokens.map((token) => (
          <div
            key={token.mintAddress}
            className="p-4 border border-green-500/30 rounded hover:border-green-500/60 hover:bg-green-500/5 cursor-pointer transition-colors"
            onClick={() => onTokenSelect?.(token)}
          >
            <h3 className="text-lg font-bold text-green-500">
              {token.name} ({token.symbol})
            </h3>
            <div className="mt-2 space-y-1 text-sm text-green-500/80">
              <p>Market Cap: ${token.marketCap?.toLocaleString()}</p>
              <p>24h Volume: ${token.volume24h?.toLocaleString()}</p>
              <p>Holders: {token.holdersCount?.toLocaleString()}</p>
              <p>Distribution: {token.distributionCategory}</p>
              {token.evolutionLevel !== undefined && (
                <p>Evolution Level: {token.evolutionLevel}</p>
              )}
              {token.currentPrice !== undefined && (
                <p>Current Price: ${token.currentPrice.toLocaleString()}</p>
              )}
              {token.nextEvolutionThreshold && (
                <p>Next Evolution: ${token.nextEvolutionThreshold.toLocaleString()}</p>
              )}
              {token.launchDate && (
                <p>Launched: {new Date(token.launchDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border border-green-500/30 rounded disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-4 py-2 text-green-500">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border border-green-500/30 rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
