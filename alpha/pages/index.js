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

const TOKENS_PER_PAGE = 12;
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

  // Initial token fetch - update to only show available tokens
  useEffect(() => {
    const fetchInitialTokens = async () => {
      try {
        setIsLoadingFeed(true);
        const { tokens } = await getTopTradingTokens();
        setTopTokens(tokens || []);
        setDisplayedTokens((tokens || []).slice(0, TOKENS_PER_PAGE));
        setHasMore((tokens || []).length > TOKENS_PER_PAGE);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
        setTopTokens([]);
        setDisplayedTokens([]);
        setHasMore(false);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    fetchInitialTokens();
  }, []);

  // Handle pagination
  useEffect(() => {
    if (page > 1) {
      const start = (page - 1) * TOKENS_PER_PAGE;
      const newTokens = topTokens.slice(start, start + TOKENS_PER_PAGE);
      setDisplayedTokens(prev => [...prev, ...newTokens]);
      setHasMore(start + TOKENS_PER_PAGE < topTokens.length);
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
          <h2 className="text-3xl font-bold mb-8">Featured Token</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingFeed ? (
              <TokenCard isLoading />
            ) : (
              displayedTokens
                .filter(token => token.address === "0x17e1f08f8f80a07406d4f05420512ab5f2d7f56e")
                .map((token) => (
                  <TokenCard 
                    key={token.address} 
                    token={token} 
                    tokenState={tokenStates[token.address]}
                    isLoading={!tokenStates[token.address]}
                  />
              ))
            )}
          </div>
        </div>

        {/* Divider between sections */}
        <div className="border-b border-green-500/20 my-12"></div>

        {/* Token Grid */}
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-between">
            <span>Trending Tokens</span>
          </h2>
          <p className="text-sm text-green-500/60 mb-8">
            sorted by last 6hr volume
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
  );
}