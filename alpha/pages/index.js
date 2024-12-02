import TokenPage from './token/[address]';
import { getTopTradingTokens, getHighlightedTokens } from '../api/tokens';
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
  const [showIntro, setShowIntro] = useState(true);
  const [tokenStates, setTokenStates] = useState({});
  const [highlightedTokens, setHighlightedTokens] = useState([]);
  const [highlightedTokenStates, setHighlightedTokenStates] = useState({});
  const [viewMode, setViewMode] = useState('latest'); // 'latest' or 'trending'

  useEffect(() => {
    // Handle visit counter cookie
    const visits = parseInt(Cookies.get(VISIT_COOKIE_NAME) || '0');
    if (visits >= 2) {
      setShowIntro(false);
    }
    Cookies.set(VISIT_COOKIE_NAME, (visits + 1).toString(), { expires: 30 });
  }, []);

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
        
        if (viewMode === 'latest') {
          const { tokens: latestTokens } = await getLatestTokens(2000);
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
      const fetchMoreTokens = async () => {
        try {
          const start = (page - 1) * TOKENS_PER_PAGE;
          
          if (viewMode === 'latest') {
            const { tokens: latestTokens } = await getLatestTokens(TOKENS_PER_PAGE * page);
            setTopTokens(latestTokens || []);
            setDisplayedTokens(prev => [...prev, ...(latestTokens || []).slice(start, start + TOKENS_PER_PAGE)]);
            setHasMore((latestTokens || []).length > start + TOKENS_PER_PAGE);
          } else {
            const { tokens: trendingTokens } = await getTopTradingTokens();
            setTopTokens(trendingTokens || []);
            setDisplayedTokens(prev => [...prev, ...(trendingTokens || []).slice(start, start + TOKENS_PER_PAGE)]);
            setHasMore((trendingTokens || []).length > start + TOKENS_PER_PAGE);
          }
        } catch (error) {
          console.error(`Failed to fetch more ${viewMode} tokens:`, error);
          setHasMore(false);
        }
      };

      fetchMoreTokens();
    }
  }, [page, viewMode]);

  // Reset pagination when switching modes
  useEffect(() => {
    setPage(1);
    setDisplayedTokens([]);
    setHasMore(true);
  }, [viewMode]);

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

  // Add effect to fetch highlighted tokens and their states
  useEffect(() => {
    const fetchHighlightedTokens = async () => {
      const tokens = await getHighlightedTokens();
      setHighlightedTokens(tokens);

      // Fetch states for highlighted tokens
      const statePromises = tokens.map(async (token) => {
        try {
          const state = await getTokenState(token.address);
          return { 
            address: token.address, 
            state: {
              ...state,
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
      
      setHighlightedTokenStates(states);
    };

    fetchHighlightedTokens();
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        
        
        {showIntro && (
          <>
            <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Evolutionary Meme Tokens
            </h1>
            <div className="space-y-6 text-lg text-green-500/80">
              <p>
                Tokens shouldn't be static. They should evolve with their communities, 
                growing and transforming as they achieve new milestones.
              </p>
              <p>
                Higherrrrrrr Protocol introduces evolutionary tokens - a new primitive where 
                a token's identity, name, and metadata autonomously evolve on-chain based on 
                its market performance and community growth.
              </p>
              <p>
                Each price milestone unlocks a new evolution, creating natural momentum and shared 
                achievements for holders. No team intervention, no off-chain voting - just pure 
                market-driven evolution.
              </p>
            </div>

            {/* NFT Section */}
            <div className="mt-12 space-y-6 text-lg text-green-500/80">
              <h2 className="text-2xl font-bold mb-4">Conviction NFTs</h2>
              <p>
                Every evolution deserves its historians. Our Conviction NFTs automatically mint 
                for significant holders, capturing the living history of each token's journey.
              </p>
              <div className="pl-6 space-y-2">
                <p>• Dynamic SVG art that evolves with each milestone</p>
                <p>• On-chain proof of early conviction</p>
                <p>• Historical achievement timestamps</p>
                <p>• Exclusive access to future evolutions</p>
              </div>
              <p>
                These aren't just badges - they're living artifacts of your belief in 
                evolution. Each NFT grows in power as its token achieves new heights, 
                creating a permanent on-chain record of your conviction.
              </p>
            </div>

            {/* Divider */}
            <div className="border-b border-green-500/20 my-12"></div>
          </>
        )}

        {/* Featured Token Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Featured Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlightedTokens.map((token) => (
              <TokenCard 
                key={token.address} 
                token={token} 
                tokenState={highlightedTokenStates[token.address]}
                isLoading={!highlightedTokenStates[token.address]}
              />
            ))}
          </div>
        </div>

        {/* Divider between sections */}
        <div className="border-b border-green-500/20 my-12"></div>

        {/* Token Grid */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold">Tokens</h2>
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="bg-black border border-green-500/20 text-green-500 px-4 py-2 rounded-lg focus:outline-none focus:border-green-500/40"
            >
              <option value="latest">Latest</option>
              <option value="trending">Trending</option>
            </select>
          </div>

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
  );
}