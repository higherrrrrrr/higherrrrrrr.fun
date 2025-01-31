// pages/index.js

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { getTopTradingTokens, getLatestTokens } from '../api/tokens';
import { getTokenState } from '../onchain/tokenState';
import TokenCard from '../components/TokenCard';
import featuredProjects from '../data/featuredProjects';
import { CountdownTimer } from '../components/CountdownTimer';
import { highliteTokens, ascendingTokens } from '../data/tokens';
import { GlitchText } from '../components/GlitchText';
import { formatCountdown } from '../utils/formatters';

// Constants
const TOKENS_PER_PAGE = 24;

/*
  1) Glitch effect for "SOLANA LAUNCH IN"
*/

/*
  2) "Snake" traveling line border
     A single neon line travels around the edge of each card in a loop.
*/
const snakeStyles = `
  .snake-border {
    position: relative;
    border: 2px solid rgba(0, 255, 0, 0.15);
    transition: transform 0.3s;
    background: rgba(0, 0, 0, 0.8);
  }
  
  .snake-border:hover {
    transform: scale(1.02);
  }

  .snake-border::after {
    content: "";
    position: absolute;
    top: 16px; left: 16px; right: 16px; bottom: 16px;
    border: 2px solid rgba(0, 255, 0, 0.15);
    border-radius: 8px;
    pointer-events: none;
    box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.05);
    transition: border-color 0.3s, box-shadow 0.3s;
  }
  
  .snake-border:hover::after {
    border-color: rgba(0, 255, 0, 0.3);
    box-shadow: inset 0 0 20px rgba(0, 255, 0, 0.1);
  }
  
  .snake-border:hover::before {
    content: "";
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    border-radius: 8px;
    pointer-events: none;
    background: linear-gradient(90deg, #00ff00 50%, transparent 50%) 0 0,
                linear-gradient(90deg, #00ff00 50%, transparent 50%) 0 100%,
                linear-gradient(0deg, #00ff00 50%, transparent 50%) 0 0,
                linear-gradient(0deg, #00ff00 50%, transparent 50%) 100% 0;
    background-repeat: no-repeat;
    background-size: 20px 2px, 20px 2px, 2px 20px, 2px 20px;
    animation: snake-travel 6s infinite linear;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
  }

  .timer-snake-border {
    position: relative;
    border: 2px solid rgba(0, 0, 0, 0.5);
  }
  
  .timer-snake-border::before {
    content: "";
    position: absolute;
    top: -2px; left: -2px; right: -2px; bottom: -2px;
    border: 2px solid transparent;
    border-radius: 8px;
    pointer-events: none;
    background: linear-gradient(90deg, #00ff00 50%, transparent 50%) 0 0,
                linear-gradient(90deg, #00ff00 50%, transparent 50%) 0 100%,
                linear-gradient(0deg, #00ff00 50%, transparent 50%) 0 0,
                linear-gradient(0deg, #00ff00 50%, transparent 50%) 100% 0;
    background-repeat: no-repeat;
    background-size: 20px 2px, 20px 2px, 2px 20px, 2px 20px;
    animation: snake-travel 6s infinite linear;
    box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  }

  @keyframes snake-travel {
    0% {
      background-position: 0 0, 0 100%, 0 0, 100% 0;
    }
    12.5% {
      background-position: 100% 0, -100% 100%, 0 0, 100% 0;
    }
    25% {
      background-position: 100% 0, -100% 100%, 0 100%, 100% 0;
    }
    37.5% {
      background-position: 100% 0, -100% 100%, 0 100%, 100% -100%;
    }
    50% {
      background-position: 0 0, 0 100%, 0 100%, 100% -100%;
    }
    62.5% {
      background-position: 0 0, 0 100%, 0 0, 100% -100%;
    }
    75% {
      background-position: 0 0, 0 100%, 0 0, 100% 0;
    }
    87.5% {
      background-position: 100% 0, -100% 100%, 0 0, 100% 0;
    }
    100% {
      background-position: 0 0, 0 100%, 0 0, 100% 0;
    }
  }
`;

function getHighliteProjects() {
  const nowMs = Date.now();
  return featuredProjects
    .map(p => {
      const launchMs = new Date(p.launchDate).getTime();
      const timeLeftMs = Math.max(launchMs - nowMs, 0);
      return {
        ...p,
        timeLeftMs
      };
    })
    .sort((a, b) => a.timeLeftMs - b.timeLeftMs)
    .slice(0, 3); // Only take first 3 projects for HighLites
}

export default function Home() {
  const [topTokens, setTopTokens] = useState([]);
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const loadingRef = useRef(null);
  const [tokenStates, setTokenStates] = useState({});
  const [viewMode, setViewMode] = useState('trending'); // 'latest' or 'trending'

  const [highliteProjects, setHighliteProjects] = useState([]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingFeed) {
        setPage((prev) => prev + 1);
      }
    }, { threshold: 0.1 });

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingFeed]);

  // Fetch tokens (trending or latest)
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
            console.error(`Error fetching state for ${token.address}:`, err);
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
        console.error('Error fetching token states:', err);
      }
    };
    fetchTokenStates();
  }, [displayedTokens]);

  useEffect(() => {
    setHighliteProjects(getHighliteProjects());
  }, []);

  // Add this useEffect for auto-updating countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setHighliteProjects(prev => 
        prev.map(proj => {
          if (proj.timeLeftMs <= 0) return { ...proj, timeLeftMs: 0 };
          return { ...proj, timeLeftMs: Math.max(proj.timeLeftMs - 1000, 0) };
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-black text-green-500 font-mono">
        {/* Hero section - removed countdown */}
        <div className="w-full border-b border-green-500/20 pb-8">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center py-8">
              <h2 className="text-2xl md:text-4xl font-bold mb-8">
                <GlitchText>HIGHER⁷</GlitchText>
              </h2>

              {/* Features Grid */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">🎨 Living Token Standard</h3>
                  <p className="text-sm opacity-80">Dynamic tokens that evolve with your cult. Watch your community transform and grow.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">🔥 Conviction NFTs</h3>
                  <p className="text-sm opacity-80">Sacred proofs of your belief. True believers are blessed at every evolution.</p>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">🎯 Pre-mint Access</h3>
                  <p className="text-sm opacity-80">Guaranteed allocation for creators. Be among the first to launch an evolving token.</p>
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

        {/* HighLites */}
        <div className="w-full pt-16 pb-16 border-b border-green-500/20">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold">HighLites</h2>
              <Link 
                href="/featured/feed"
                className="px-4 py-2 border border-green-500/30 rounded hover:border-green-500 transition-colors"
              >
                View All
              </Link>
            </div>

            {/* Scaled down cards while maintaining proportions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {highliteProjects.map((project) => (
                <Link key={project.slug} href={`/featured/${project.slug}`} className="w-[280px] mx-auto">
                  <div className="snake-border p-8 bg-black/20 rounded h-full flex flex-col">
                    <div className="snake-line"></div>
                    {project.imageUrl && (
                      <div className="aspect-square mb-6 overflow-hidden rounded">
                        <img
                          src={project.imageUrl}
                          alt={project.name}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <h3 className="text-2xl font-bold mb-3">{project.name}</h3>
                    <p className="text-sm text-green-500/70 mb-6 flex-grow">
                      {project.description}
                    </p>
                    <div className="text-green-300 font-mono text-sm">
                      <span className="opacity-70 mr-2">Launch:</span>
                      {formatCountdown(project.timeLeftMs)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Ascending */}
        <div className="w-full pt-8 pb-8 border-b border-green-500/20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold">Ascending</h2>
              <p className="text-green-500/60 text-sm">Coming Sewn…</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
              <div className="snake-border rounded text-center">
                <div className="snake-line"></div>
                <div className="p-8">
                  <h3 className="text-lg font-bold text-green-300">
                    Coming Sewn
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Base Tokens => trending or latest */}
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
                  : displayedTokens.map((token, i) => (
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

              {/* Infinite scroll loader */}
              {hasMore && (
                <div ref={loadingRef} className="text-center py-12 text-green-500/50">
                  {isLoadingFeed ? 'Loading more tokens...' : 'Scroll for more'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}