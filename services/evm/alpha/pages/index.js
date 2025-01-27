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
import { ConnectKitButton } from '../components/Web3Provider';

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

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Top Navigation */}
      <header className="border-b border-green-500/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-4">
            <Link href="/" className="text-xl">
              Higherrr
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/how-it-works" className="text-green-500/80 hover:text-green-500">
                How it Works
              </Link>
              <Link 
                href="/launch"
                className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400"
              >
                Launch Token
              </Link>
              <ConnectKitButton />
            </div>
          </div>

          {/* Main Navigation */}
          <nav className="flex justify-center space-x-8">
            <Link href="/app" className="hover:text-green-400">App</Link>
            <Link href="/token-screener" className="hover:text-green-400">Screener</Link>
            <Link href="/featured" className="hover:text-green-400">Featured</Link>
            <Link href="/dashboard" className="hover:text-green-400">Portfolio</Link>
            <Link href="/creator-dashboard" className="hover:text-green-400">Creator</Link>
            <Link href="/plex" className="hover:text-green-400">Plex</Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* View Toggle */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Trending Tokens</h1>
            <p className="text-green-500/60">
              {viewMode === 'latest' ? 'newest token launches' : 'sorted by last 6hr volume'}
            </p>
          </div>
          
          <select 
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className="bg-black border border-green-500/20 text-green-500 px-4 py-2 rounded-lg"
          >
            <option value="trending">Trending</option>
            <option value="latest">Latest</option>
          </select>
        </div>

        {/* Token Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedTokens.map((token) => (
            <TokenCard 
              key={token.address}
              token={token}
              tokenState={tokenStates[token.address]}
              isLoading={!tokenStates[token.address]}
            />
          ))}
        </div>

        {/* Loading Indicator */}
        {hasMore && (
          <div ref={loadingRef} className="text-center py-12 text-green-500/50">
            {isLoadingFeed ? 'Loading more tokens...' : 'Scroll for more'}
          </div>
        )}
      </main>
    </div>
  );
}