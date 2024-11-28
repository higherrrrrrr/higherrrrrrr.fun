import TokenPage from './token/[address]';
import { getTopTradingTokens } from '../api/tokens';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useBalance, useAccount } from 'wagmi';
import Cookies from 'js-cookie';

const TOKENS_PER_PAGE = 10;
const VISIT_COOKIE_NAME = 'homepage_visits';

export default function Home() {
  const [topTokens, setTopTokens] = useState([]);
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(null);
  const [showIntro, setShowIntro] = useState(true);

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
      <div className="max-w-4xl mx-auto px-4 py-12 md:py-16">
        
        
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
          <TokenPage addressProp="0x17e1f08f8f80a07406d4f05420512ab5f2d7f56e" />
        </div>

        {/* Divider between sections */}
        <div className="border-b border-green-500/20 my-12"></div>

        {/* Token Feed */}
        <div>
          <h2 className="text-3xl font-bold mb-2 flex items-center justify-between">
            <span>Trending Tokens</span>
          </h2>
          <p className="text-sm text-green-500/60 mb-8">
            sorted by last 6hr volume
          </p>

          <div>
            {displayedTokens.map((token, index) => (
              <div key={token.address}>
                {index > 0 && (
                  <div className="my-12 border-t border-green-500/20" />
                )}
                
                <div>
                  <TokenPage addressProp={token.address} />
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {hasMore && (
              <div 
                ref={loadingRef}
                className="text-center py-12 text-green-500/50 border-t border-green-500/20 mt-12"
              >
                {isLoadingFeed ? 'Loading more tokens...' : 'Scroll for more'}
              </div>
            )}

            {/* Initial loading state */}
            {isLoadingFeed && displayedTokens.length === 0 && (
              <div className="space-y-12">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    {i > 0 && <div className="my-12 border-t border-green-500/20" />}
                    <div className="animate-pulse border border-green-500/20 rounded-lg p-6">
                      <div className="h-4 bg-green-500/20 w-1/4 rounded mb-4" />
                      <div className="h-8 bg-green-500/20 w-3/4 rounded" />
                    </div>
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