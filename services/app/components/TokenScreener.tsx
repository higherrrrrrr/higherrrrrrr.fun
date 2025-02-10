'use client';

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { formatNumber, formatPriceChange, getPriceChangeColor } from '@/lib/format';
import useSWR from 'swr';
import { getTokenState } from '@/lib/onchain/tokenState';
import { useHeliusTokens } from '@/hooks/useHelius';
import { useSolana } from '@/components/SolanaProvider';
import type { HeliusToken } from '@/lib/types';

type TimeFrame = '1h' | '24h' | '7d';
type SortField = 'price' | 'marketCap' | 'volume' | 'holders' | 'whaleScore' | 'level';
type FilterType = 'all' | 'gainers' | 'losers' | 'whales' | 'distributed';

// Add loading skeleton
function TokenScreenerSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-10 bg-green-500/10 rounded mb-4" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-green-500/10 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function TokenScreener() {
  const { tokens, isLoading, error } = useHeliusTokens();
  const { isReady } = useSolana();
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('24h');
  const [sortField, setSortField] = useState<SortField>('volume');
  const [sortAsc, setSortAsc] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [minMarketCap, setMinMarketCap] = useState(0);
  const [minVolume, setMinVolume] = useState(0);

  // Add level info from token state
  const [tokenStates, setTokenStates] = useState({});

  // Fetch token states
  useEffect(() => {
    const fetchTokenStates = async () => {
      if (!tokens?.length) return;

      try {
        const statePromises = tokens.map(async (token) => {
          try {
            const state = await getTokenState(token.address);
            return {
              address: token.address,
              state
            };
          } catch (err) {
            return { address: token.address, state: null };
          }
        });

        const results = await Promise.all(statePromises);
        const states = {};
        results.forEach((r) => {
          if (r.state) {
            states[r.address] = r.state;
          }
        });
        setTokenStates(states);
      } catch (err) {
        console.error('Failed to fetch token states:', err);
      }
    };

    fetchTokenStates();
  }, [tokens]);

  const filteredTokens = tokens?.filter(token => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        token.symbol.toLowerCase().includes(query) ||
        token.name.toLowerCase().includes(query) ||
        token.address.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Market cap filter
    if (minMarketCap > 0 && token.marketCap < minMarketCap) return false;

    // Volume filter
    const volume = timeFrame === '1h' ? token.volume1h :
                  timeFrame === '24h' ? token.volume24h :
                  token.volume7d;
    if (minVolume > 0 && volume < minVolume) return false;

    // Type filters
    switch (activeFilter) {
      case 'gainers':
        return token[`priceChange${timeFrame}`] > 0;
      case 'losers':
        return token[`priceChange${timeFrame}`] < 0;
      case 'whales':
        return token.whaleScore > 75; // High whale concentration
      case 'distributed':
        return token.whaleScore < 25; // Well distributed
      default:
        return true;
    }
  }) || [];

  const sortedTokens = [...filteredTokens].sort((a, b) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (sortField.includes('priceChange')) {
      aValue = Math.abs(aValue);
      bValue = Math.abs(bValue);
    }
    
    return sortAsc ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc); // Toggle direction if same field
    } else {
      setSortField(field);
      setSortAsc(false); // Default to descending for new field
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortAsc ? '↑' : '↓';
  };

  if (!isReady) {
    return <TokenScreenerSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10">
        <h2 className="text-red-500 font-bold mb-2">Error loading tokens</h2>
        <p className="text-red-500/70">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name, symbol, or address..."
            className="flex-1 bg-black border border-green-500/30 rounded-lg px-4 py-2 text-green-500 placeholder-green-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            value={timeFrame}
            onChange={(e) => setTimeFrame(e.target.value as TimeFrame)}
            className="bg-black border border-green-500/30 rounded-lg px-4 py-2 text-green-500"
          >
            <option value="1h">1H</option>
            <option value="24h">24H</option>
            <option value="7d">7D</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'all' 
                ? 'bg-green-500 text-black' 
                : 'border border-green-500/30 text-green-500'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveFilter('gainers')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'gainers'
                ? 'bg-green-500 text-black'
                : 'border border-green-500/30 text-green-500'
            }`}
          >
            Gainers
          </button>
          <button
            onClick={() => setActiveFilter('losers')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'losers'
                ? 'bg-green-500 text-black'
                : 'border border-green-500/30 text-green-500'
            }`}
          >
            Losers
          </button>
          <button
            onClick={() => setActiveFilter('whales')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'whales'
                ? 'bg-green-500 text-black'
                : 'border border-green-500/30 text-green-500'
            }`}
          >
            Whale Holders
          </button>
          <button
            onClick={() => setActiveFilter('distributed')}
            className={`px-4 py-2 rounded-lg ${
              activeFilter === 'distributed'
                ? 'bg-green-500 text-black'
                : 'border border-green-500/30 text-green-500'
            }`}
          >
            Well Distributed
          </button>
        </div>
      </div>

      {/* Token Table */}
      <div className="border border-green-500/30 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-green-500/5">
            <tr>
              <th className="text-left p-4">Token</th>
              <th 
                className="text-right p-4 cursor-pointer hover:bg-green-500/10"
                onClick={() => handleSort('level')}
              >
                Level {getSortIcon('level')}
              </th>
              <th 
                className="text-right p-4 cursor-pointer hover:bg-green-500/10"
                onClick={() => handleSort('price')}
              >
                Price {getSortIcon('price')}
              </th>
              <th 
                className="text-right p-4 cursor-pointer hover:bg-green-500/10"
                onClick={() => handleSort('priceChange')}
              >
                Change {getSortIcon('priceChange')}
              </th>
              <th 
                className="text-right p-4 cursor-pointer hover:bg-green-500/10"
                onClick={() => handleSort('volume')}
              >
                Volume {getSortIcon('volume')}
              </th>
              <th 
                className="text-right p-4 cursor-pointer hover:bg-green-500/10"
                onClick={() => handleSort('marketCap')}
              >
                Market Cap {getSortIcon('marketCap')}
              </th>
              <th 
                className="text-right p-4 cursor-pointer hover:bg-green-500/10"
                onClick={() => handleSort('holders')}
              >
                Holders {getSortIcon('holders')}
              </th>
              <th 
                className="text-right p-4 cursor-pointer hover:bg-green-500/10"
                onClick={() => handleSort('whaleScore')}
              >
                Distribution {getSortIcon('whaleScore')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTokens.map(token => {
              const state = tokenStates[token.address];
              const level = state?.level || 1;
              const progress = state?.levelProgress || 0;
              const maxLevel = state?.maxLevel || 7;

              return (
                <tr key={token.address} className="border-t border-green-500/10 hover:bg-green-500/5">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{token.symbol}</div>
                      <div className="text-sm text-green-500/70">{token.name}</div>
                      {token.metadata?.image && (
                        <img 
                          src={token.metadata.image} 
                          alt={token.name}
                          className="w-6 h-6 rounded-full mt-1"
                        />
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col items-end gap-1">
                      <div className="font-bold text-green-500">
                        Level {level}
                      </div>
                      {level < maxLevel && (
                        <div className="w-24 h-1 bg-green-500/20 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                      {level < maxLevel && (
                        <div className="text-xs text-green-500/50">
                          {progress.toFixed(1)}% to Level {level + 1}
                        </div>
                      )}
                      {level === maxLevel && (
                        <div className="text-xs text-purple-400/70">
                          Max Level
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="text-right p-4">${formatNumber(token.price)}</td>
                  <td className={`text-right p-4 ${getPriceChangeColor(token[`priceChange${timeFrame}`])}`}>
                    {formatPriceChange(token[`priceChange${timeFrame}`])}
                  </td>
                  <td className="text-right p-4">${formatNumber(token[`volume${timeFrame}`])}</td>
                  <td className="text-right p-4">${formatNumber(token.marketCap)}</td>
                  <td className="text-right p-4">{formatNumber(token.holders)}</td>
                  <td className="text-right p-4">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-20 bg-green-500/20 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-full rounded-full"
                          style={{ width: `${token.whaleScore}%` }}
                        />
                      </div>
                      <span className="text-sm">{token.whaleScore}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 