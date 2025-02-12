// pages/index.js

'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useHomepage } from '../hooks/useHomepage';
import { SolanaTokenCard } from '../components/SolanaTokenCard';
import { GlitchText } from '../components/GlitchText';
import { formatCountdown } from '../utils/formatters';
import { getHighliteProjects } from '../utils/projects';
import { GlowBorder } from '../components/GlowBorder.js';
import debounce from 'lodash/debounce'; // You may need to install lodash
import { useTokenSearch } from '../hooks/useTokenSearch';
import useSWR from 'swr';

export default function Home() {
  const { majorTokens, memeTokens, vcTokens, loading: tokensLoading } = useHomepage();
  const [selectedCategory, setSelectedCategory] = useState('meme');
  const {
    query: searchQuery,
    results: searchResults,
    isLoading: isSearching,
    error: searchError,
    handleSearch,
    clearSearch
  } = useTokenSearch();
  const [highliteProjects, setHighliteProjects] = useState([]);

  useEffect(() => {
    setHighliteProjects(getHighliteProjects());
  }, []);

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

  const categories = [
    { id: 'meme', name: 'Memes' },
    { id: 'major', name: 'Majors' },
    { id: 'vc', name: 'VC Backed' }
  ];

  const getTokensForCategory = () => {
    switch (selectedCategory) {
      case 'major':
        return majorTokens;
      case 'meme':
        return memeTokens;
      case 'vc':
        return vcTokens;
      default:
        return memeTokens; // Default to showing memes
    }
  };

  // Add debouncing to your data fetching
  const debouncedFetch = useCallback(
    debounce(async () => {
      // Your fetch logic here
    }, 1000), // Only update every second
    []
  );

  // SWR configuration
  const { data } = useSWR('/api/tokens', fetcher, {
    refreshInterval: 1000, // Poll every second
    dedupingInterval: 1000, // Dedupe requests
    keepPreviousData: true,
    revalidateOnFocus: false, // Prevent revalidation on window focus
    revalidateOnReconnect: false // Prevent revalidation on reconnect
  });

  if (searchError) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Error loading tokens</h2>
          <p className="text-green-400/70">{searchError}</p>
        </div>
      </div>
    );
  }

  if (!memeTokens?.length && !tokensLoading) {
    console.log('No meme tokens found:', {
      memeTokens,
      majorTokens,
      vcTokens,
      tokensLoading,
      searchError
    });
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Hero section */}
      <div className="w-full border-b border-green-500/20 pb-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-16">
            <h1 className="text-4xl md:text-6xl font-bold mb-8">
              <div className="flex justify-center">
                <div className="relative left-3">
                  <GlitchText>HIGHER⁷</GlitchText>
                </div>
              </div>
            </h1>
            
            <p className="text-xl md:text-2xl mb-12 text-green-500/80">
              Believe in something
            </p>

            <div className="flex justify-center">
              <GlowBorder>
                <button 
                  className="px-8 py-3 text-lg text-green-400/50 font-bold whitespace-nowrap bg-black rounded-lg"
                  disabled
                >
                  Launch Token (Coming Sewn)
                </button>
              </GlowBorder>
            </div>
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
              className="px-4 py-2 text-green-500/80 hover:text-green-400 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highliteProjects.map((project) => (
              <Link key={project.slug} href={`/featured/${project.slug}`} className="block w-full">
                <GlowBorder className="p-6 bg-black/20 h-full flex flex-col">
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
                </GlowBorder>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Token Categories */}
      <div className="w-full pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Explore</h2>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <input
              type="text"
              placeholder="Search by name, symbol, or address..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full px-4 py-2 bg-black border border-green-500/20 rounded-lg 
                       text-green-500 placeholder-green-500/50 focus:outline-none 
                       focus:border-green-500/50 transition-colors"
            />
            {searchError && (
              <p className="mt-2 text-red-500 text-sm">{searchError}</p>
            )}
          </div>

          {/* Category Tabs - Only show if not searching */}
          {!searchQuery && (
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-6 py-2 rounded-lg transition-colors whitespace-nowrap
                    ${selectedCategory === category.id 
                      ? 'bg-green-500 text-black' 
                      : 'bg-green-500/10 hover:bg-green-500/20'
                    }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          )}

          {/* Token Grid */}
          {isSearching || tokensLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={`loading-${i}`} className="h-48 rounded-lg bg-green-500/5 animate-pulse" />
              ))}
            </div>
          ) : searchResults ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.length > 0 ? (
                searchResults.map(token => (
                  <div 
                    key={`${token.token_address}-search`}
                    className="transition-all duration-200"
                  >
                    <SolanaTokenCard
                      token={token}
                      category={null}
                    />
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center py-12 text-green-500/70">
                  No tokens found matching "{searchQuery}"
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getTokensForCategory().map(token => (
                <div 
                  key={`${token.token_address}-${selectedCategory}`}
                  className="transition-all duration-200"
                >
                  <SolanaTokenCard
                    token={token}
                    category={selectedCategory}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Define fetcher if not already defined
const fetcher = url => fetch(url).then(res => res.json());