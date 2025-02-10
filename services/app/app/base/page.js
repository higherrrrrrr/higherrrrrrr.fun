'use client';

import { useState, useEffect } from 'react';
import { getTopTradingTokens, getLatestTokens, getTokenState } from '../../lib/api';
import TokenCard from '../../components/TokenCard';

// Constants
const TOKENS_PER_PAGE = 24;

export default function BaseTokens() {
  const [topTokens, setTopTokens] = useState([]);
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [tokenStates, setTokenStates] = useState({});
  const [viewMode, setViewMode] = useState('trending');

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (!hasMore || isLoadingFeed) return;

      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100;

      if (scrolledToBottom) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [hasMore, isLoadingFeed]);

  // Fetch tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setIsLoadingFeed(true);
        setPage(1);

        if (viewMode === 'latest') {
          const { tokens: latestTokens } = await getLatestTokens();
          setTopTokens(latestTokens || []);
          setDisplayedTokens((latestTokens || []).slice(0, TOKENS_PER_PAGE));
          setHasMore((latestTokens || []).length > TOKENS_PER_PAGE);
        } else {
          const { tokens: trendingTokens } = await getTopTradingTokens();
          setTopTokens(trendingTokens || []);
          setDisplayedTokens((trendingTokens || []).slice(0, TOKENS_PER_PAGE));
          setHasMore((trendingTokens || []).length > TOKENS_PER_PAGE);
        }
      } catch (error) {
        setTopTokens([]);
        setDisplayedTokens([]);
        setHasMore(false);
      } finally {
        setIsLoadingFeed(false);
      }
    };
    fetchTokens();
  }, [viewMode]);

  // Handle pagination
  useEffect(() => {
    if (page > 1) {
      const start = (page - 1) * TOKENS_PER_PAGE;
      const end = start + TOKENS_PER_PAGE;
      const newTokens = topTokens.slice(start, end);

      setDisplayedTokens((prev) => [...prev, ...newTokens]);
      setHasMore(end < topTokens.length);
    }
  }, [page, topTokens]);

  // Fetch token states
  useEffect(() => {
    const fetchTokenStates = async () => {
      if (!displayedTokens.length) return;

      try {
        const statePromises = displayedTokens.map(async (token) => {
          try {
            const state = await getTokenState(token.address);
            const progress =
              state?.marketType === 'bonding_curve'
                ? (state.currentPrice / state.priceLevels[state.priceLevels.length - 1]) * 100
                : null;

            return {
              address: token.address,
              state: { ...state, progress },
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
        // Silently fail
      }
    };
    fetchTokenStates();
  }, [displayedTokens]);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="w-full pt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Base Tokens</h1>
            <p className="text-green-500/60">⚠️ Deprecated: Moving to Solana</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">
                {viewMode === 'latest' ? 'Latest Tokens' : 'Trending Tokens'}
              </h3>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="bg-black border border-green-500/30 text-green-500 px-4 py-2 rounded-lg 
                           hover:border-green-500 focus:outline-none focus:border-green-500/40"
              >
                <option value="trending">Trending</option>
                <option value="latest">Latest</option>
              </select>
            </div>

            <p className="text-sm text-green-500/60 mb-8">
              {viewMode === 'latest'
                ? 'newest token launches'
                : 'sorted by last 6hr volume'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingFeed
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="snake-border p-4 bg-black/20 rounded">
                      <div className="snake-line"></div>
                      <TokenCard isLoading />
                    </div>
                  ))
                : displayedTokens.map((token) => (
                    <div
                      key={token.address}
                      className="snake-border p-4 bg-black/20 rounded"
                    >
                      <div className="snake-line"></div>
                      <TokenCard
                        token={token}
                        tokenState={tokenStates[token.address]}
                        isLoading={!tokenStates[token.address]}
                      />
                    </div>
                  ))}
            </div>

            {hasMore && (
              <div className="text-center py-12 text-green-500/50">
                {isLoadingFeed ? 'Loading more tokens...' : 'Scroll for more'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 