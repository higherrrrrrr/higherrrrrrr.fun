import TokenPage from './token/[address]';
import { getTopTradingTokens } from '../api/tokens';
import { useState, useEffect, useRef } from 'react';
import Cookies from 'js-cookie';
import Link from 'next/link';
import Image from 'next/image';
import { useContractRead } from 'wagmi';
import { getTokenContract } from '../api/contract';
import { getTokenState } from '../onchain/tokenState';
import TokenCard from '../components/TokenCard';
import { getLatestTokens } from '../api/tokens';

const TOKENS_PER_PAGE = 24;
const VISIT_COOKIE_NAME = 'homepage_visits';

export default function Home() {
  const [topTokens, setTopTokens] = useState([]);
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(null);
  const [tokenStates, setTokenStates] = useState({});
  const [viewMode, setViewMode] = useState('trending'); // 'latest' or 'trending'
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Intersection Observer setup
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoadingFeed) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingFeed]);

  // Initial token fetch - update to handle both modes
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setIsLoadingFeed(true);
        setPage(1); // Reset page when switching modes
        
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
        console.error(`Failed to fetch ${viewMode} tokens:`, error);
        setTopTokens([]);
        setDisplayedTokens([]);
        setHasMore(false);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    fetchTokens();
  }, [viewMode]);

  // Handle pagination for both modes
  useEffect(() => {
    if (page > 1) {
      const start = (page - 1) * TOKENS_PER_PAGE;
      const end = start + TOKENS_PER_PAGE;
      
      // Use the tokens we already have in topTokens
      const newTokens = topTokens.slice(start, end);
      setDisplayedTokens(prev => [...prev, ...newTokens]);
      setHasMore(end < topTokens.length);
    }
  }, [page, topTokens]);

  // Modified effect to fetch token states in parallel
  useEffect(() => {
    const fetchTokenStates = async () => {
      if (!displayedTokens.length) return;
      
      try {
        const statePromises = displayedTokens.map(async (token) => {
          try {
            const state = await getTokenState(token.address);
            return { 
              address: token.address, 
              state: {
                ...state,
                // Calculate progress percentage if on bonding curve
                progress: state.marketType === 'bonding_curve' ? 
                  (state.currentPrice / state.priceLevels[state.priceLevels.length - 1]) * 100 : 
                  null
              }
            };
          } catch (error) {
            console.error(`Error fetching state for ${token.address}:`, error);
            return { address: token.address, state: null };
          }
        });

        const results = await Promise.all(statePromises);
        
        const states = {};
        results.forEach((result) => {
          if (result.state) {
            states[result.address] = result.state;
          }
        });
        
        setTokenStates(states);
      } catch (error) {
        console.error('Error fetching token states:', error);
      }
    };

    fetchTokenStates();
  }, [displayedTokens]);

  // Add countdown timer effect
  useEffect(() => {
    const targetDate = new Date('2025-01-31T15:00:00-08:00').getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Solana Countdown Section */}
      <div className="w-full border-b border-green-500/20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-8">
            <h2 className="text-2xl md:text-4xl font-bold mb-8">SOLANA LAUNCH IN</h2>
            <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto mb-12">
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-bold mb-2 border border-green-500/20 rounded-lg p-3 min-w-[80px] bg-black/50">
                  {timeLeft.days.toString().padStart(2, '0')}
                </div>
                <div className="text-xs md:text-sm text-green-500/60">DAYS</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-bold mb-2 border border-green-500/20 rounded-lg p-3 min-w-[80px] bg-black/50">
                  {timeLeft.hours.toString().padStart(2, '0')}
                </div>
                <div className="text-xs md:text-sm text-green-500/60">HOURS</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-bold mb-2 border border-green-500/20 rounded-lg p-3 min-w-[80px] bg-black/50">
                  {timeLeft.minutes.toString().padStart(2, '0')}
                </div>
                <div className="text-xs md:text-sm text-green-500/60">MINUTES</div>
              </div>
              <div className="flex flex-col items-center">
                <div className="text-2xl md:text-4xl font-bold mb-2 border border-green-500/20 rounded-lg p-3 min-w-[80px] bg-black/50">
                  {timeLeft.seconds.toString().padStart(2, '0')}
                </div>
                <div className="text-xs md:text-sm text-green-500/60">SECONDS</div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
              <div className="space-y-2">
                <h3 className="text-xl font-bold">🎨 Living Token Standard</h3>
                <p className="text-sm opacity-80">Dynamic tokens that evolve with your cult. Watch your community transform and grow.</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold">💰 Evolution Rewards</h3>
                <p className="text-sm opacity-80">Earn from every evolution. Direct rewards for leaders and their followers.</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold">🎯 Early Access</h3>
                <p className="text-sm opacity-80">Launch with guaranteed allocation. Build the future of evolving tokens.</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold">🚀 Growth Mechanics</h3>
                <p className="text-sm opacity-80">Tokens that evolve with your following. Each milestone unlocks new potential.</p>
              </div>
            </div>

            <p className="mt-8 text-sm md:text-base opacity-80">
              The evolution of cult coins begins here.
            </p>
          </div>
        </div>
      </div>

      {/* Base Tokens Section */}
      <div className="w-full pt-8">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8">Base Tokens</h2>

          <div>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold">
                {viewMode === 'latest' ? 'Latest Tokens' : 'Trending Tokens'}
              </h3>
              <select 
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value)}
                className="bg-black border border-green-500/20 text-green-500 px-4 py-2 rounded-lg focus:outline-none focus:border-green-500/40"
              >
                <option value="trending">Trending</option>
                <option value="latest">Latest</option>
              </select>
            </div>
            <p className="text-sm text-green-500/60 mb-8">
              {viewMode === 'latest' 
                ? 'newest token launches'
                : 'sorted by last 6hr volume'
              }
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingFeed ? (
                [...Array(6)].map((_, i) => <TokenCard key={i} isLoading />)
              ) : (
                displayedTokens.map((token) => (
                  <TokenCard 
                    key={token.address} 
                    token={token} 
                    tokenState={tokenStates[token.address]}
                    isLoading={!tokenStates[token.address]}
                  />
                ))
              )}
            </div>

            {/* Loading indicator */}
            {hasMore && (
              <div 
                ref={loadingRef}
                className="text-center py-12 text-green-500/50"
              >
                {isLoadingFeed ? 'Loading more tokens...' : 'Scroll for more'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}