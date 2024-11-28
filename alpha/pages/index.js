import TokenPage from './token/[address]';
import { getTopTradingTokens } from '../api/tokens';
import { useState, useEffect, useRef, useCallback } from 'react';

const TOKENS_PER_PAGE = 10;

export default function Home() {
  const [topTokens, setTopTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [displayCount, setDisplayCount] = useState(TOKENS_PER_PAGE);
  const [allTokensFetched, setAllTokensFetched] = useState(false);

  // Intersection Observer ref
  const observer = useRef();
  const lastTokenRef = useCallback(node => {
    if (isLoadingFeed) return;
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !allTokensFetched) {
        setDisplayCount(prev => prev + TOKENS_PER_PAGE);
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingFeed, hasMore, allTokensFetched]);

  // Fetch top trading tokens
  useEffect(() => {
    const fetchTopTokens = async () => {
      try {
        const { tokens } = await getTopTradingTokens();
        setTopTokens(tokens);
        setHasMore(tokens.length > TOKENS_PER_PAGE);
        setAllTokensFetched(true);
      } catch (error) {
        console.error('Failed to fetch top tokens:', error);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    fetchTopTokens();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTopTokens, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

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

          {isLoadingFeed ? (
            <div className="space-y-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse border border-green-500/20 rounded-lg p-6">
                  <div className="h-4 bg-green-500/20 w-1/4 rounded mb-4" />
                  <div className="h-8 bg-green-500/20 w-3/4 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-12">
              {topTokens.slice(0, displayCount).map((token, index) => {
                const isLastToken = index === displayCount - 1;
                return (
                  <div 
                    key={token.address} 
                    ref={isLastToken ? lastTokenRef : null}
                    className="border-t border-green-500/10 pt-8 first:border-t-0 first:pt-0"
                  >
                    <TokenPage addressProp={token.address} />
                  </div>
                );
              })}
              {isLoadingFeed && (
                <div className="text-center text-green-500/50 py-4">
                  Loading more tokens...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}