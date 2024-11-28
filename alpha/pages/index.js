import TokenPage from './token/[address]';
import { getTopTradingTokens } from '../api/tokens';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useBalance, useAccount } from 'wagmi';

const TOKENS_PER_PAGE = 10;

export default function Home() {
  const [topTokens, setTopTokens] = useState([]);
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(null);

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

  // Initial token fetch
  useEffect(() => {
    const fetchInitialTokens = async () => {
      try {
        setIsLoadingFeed(true);
        const { tokens } = await getTopTradingTokens();
        setTopTokens(tokens);
        setDisplayedTokens(tokens.slice(0, TOKENS_PER_PAGE));
        setHasMore(tokens.length > TOKENS_PER_PAGE);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
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

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Introduction Section */}
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        <h1 className="text-3xl md:text-4xl font-bold mb-8">
          Evolutionary Tokens
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

        {/* Divider */}
        <div className="border-b border-green-500/20 my-12"></div>

        {/* Token Feed */}
        <div>
          <h2 className="text-xl font-bold mb-8 flex items-center justify-between">
            <span>Top Trading Tokens</span>
          </h2>

          <div className="space-y-12">
            {displayedTokens.map((token, index) => (
              <div 
                key={token.address} 
                className="border-t border-green-500/10 pt-8 first:border-t-0 first:pt-0"
              >
                <TokenPage addressProp={token.address} />
              </div>
            ))}

            {/* Loading indicator */}
            {hasMore && (
              <div 
                ref={loadingRef}
                className="text-center py-8 text-green-500/50"
              >
                {isLoadingFeed ? 'Loading more tokens...' : 'Scroll for more'}
              </div>
            )}

            {/* Initial loading state */}
            {isLoadingFeed && displayedTokens.length === 0 && (
              <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse border border-green-500/20 rounded-lg p-6">
                    <div className="h-4 bg-green-500/20 w-1/4 rounded mb-4" />
                    <div className="h-8 bg-green-500/20 w-3/4 rounded" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}