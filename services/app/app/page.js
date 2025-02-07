// pages/index.js

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTopTradingTokens, getLatestTokens } from '../api/tokens';
import { getTokenState } from '../onchain/tokenState';
import TokenCard from '../components/TokenCard';
import featuredProjects from '../data/featuredProjects';
import { highliteTokens, ascendingTokens } from '../data/tokens';
import { GlitchText } from '../components/GlitchText';
import { formatCountdown } from '../utils/formatters';
import { getHighliteProjects } from '../utils/projects';

// Constants
const TOKENS_PER_PAGE = 24;
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

export default function Home() {
  const [topTokens, setTopTokens] = useState([]);
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [tokenStates, setTokenStates] = useState({});
  const [viewMode, setViewMode] = useState('trending');
  const [highliteProjects, setHighliteProjects] = useState([]);

  // Replace useRef-based infinite scroll with scroll event listener
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
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Hero section */}
      <div className="w-full border-b border-green-500/20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-8">
              <GlitchText>HIGHER⁷</GlitchText>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-green-500/80">
              The finest place on the internet to trade shitcoins
            </p>

            <button 
              className="px-6 py-3 border-2 border-green-500/30 rounded-lg 
                         hover:border-green-500 transition-colors text-lg"
              disabled
            >
              Launch Token (Coming Soon)
            </button>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highliteProjects.map((project) => (
              <Link key={project.slug} href={`/featured/${project.slug}`} className="block w-full">
                <div className="snake-border p-6 bg-black/20 rounded h-full flex flex-col">
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
                  <h3 className="text-xl md:text-2xl font-bold mb-3">{project.name}</h3>
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
    </div>
  );
}