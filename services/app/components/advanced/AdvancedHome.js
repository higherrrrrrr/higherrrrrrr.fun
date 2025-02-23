'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useHomepage } from '../../hooks/useHomepage';
import { SolanaTokenCard } from '../SolanaTokenCard';
import { GlitchText } from '../GlitchText';
import { formatCountdown } from '../../utils/formatters';
import { getHighliteProjects } from '../../utils/projects';
import { GlowBorder } from '../GlowBorder';
import debounce from 'lodash/debounce';
import { useTokenSearch } from '../../hooks/useTokenSearch';
import { useTokenFilter } from '../../hooks/useTokenFilter';
import { TokenFilters } from '../TokenFilters';
import { TokenDisplay } from '../TokenDisplay';
import { processTokens } from '../../utils/tokenProcessing';

export function AdvancedHome() {
  const { majorTokens, memeTokens, vcTokens, loading: tokensLoading } = useHomepage();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const {
    query: searchQuery,
    handleSearch,
    searchTokens,
    isLoading: isSearching,
    error: searchError,
    clearSearch
  } = useTokenSearch();
  const [highliteProjects, setHighliteProjects] = useState([]);
  const {
    tokens,
    error: filterError,
    isLoading: filterLoading,
    filters,
    updateFilters
  } = useTokenFilter();

  // Add filter key for TokenDisplay
  const filterKey = JSON.stringify({
    filters,
    selectedCategory,
    searchQuery
  });

  // Handle search changes
  const handleSearchChange = (value) => {
    handleSearch(value);
    updateFilters({
      ...filters,
      page: 1,
      category: selectedCategory
    });
  };

  // Get display tokens
  const getDisplayTokens = () => {
    let displayTokens;
    
    if (tokens && Object.values(filters).some(v => v)) {
      displayTokens = tokens;
    } else {
      switch (selectedCategory) {
        case 'major':
          displayTokens = processTokens(majorTokens, { sortBy: filters.sortBy });
          break;
        case 'meme':
          displayTokens = processTokens(memeTokens, { sortBy: filters.sortBy });
          break;
        case 'vc':
          displayTokens = processTokens(vcTokens, { sortBy: filters.sortBy });
          break;
        default:
          const allTokens = [...majorTokens, ...memeTokens, ...vcTokens];
          const uniqueTokens = Array.from(new Map(allTokens.map(token => 
            [token.token_address, token]
          )).values());
          displayTokens = processTokens(uniqueTokens, { sortBy: filters.sortBy });
      }
    }
    
    return searchQuery ? searchTokens(displayTokens, searchQuery) : displayTokens;
  };

  // Update filters
  const handleFilterUpdate = (newFilters) => {
    updateFilters({
      ...filters,
      ...newFilters,
      page: 1,
      category: selectedCategory
    });
  };

  // Handle category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    updateFilters({
      ...filters,
      category,
      page: 1
    });
  };

  // Initialize highlite projects
  useEffect(() => {
    setHighliteProjects(getHighliteProjects());
  }, []);

  // Update highlite project countdowns
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

  // Handle token clicks
  const handleTokenClick = useCallback((token) => {
    if (typeof window !== 'undefined' && window.Jupiter) {
      try {
        window.Jupiter.init({
          endpoint: "https://netti-iof1ud-fast-mainnet.helius-rpc.com",
          displayMode: "modal",
          defaultExplorer: "Solana Explorer",
          strictTokenList: false,
          formProps: {
            initialInputMint: "So11111111111111111111111111111111111111112",
            fixedInputMint: false,
            initialOutputMint: token.address || token.token_address,
            fixedOutputMint: false,
            swapMode: "ExactIn"
          }
        });
      } catch (error) {
        console.error('Failed to open Jupiter Terminal:', error);
      }
    }
  }, []);

  const categories = [
    { id: 'meme', name: 'Memes' },
    { id: 'major', name: 'Majors' },
    { id: 'vc', name: 'VC Backed' }
  ];

  // Add debounced fetch
  const debouncedFetch = useCallback(
    debounce(async () => {
      // Your fetch logic here
    }, 1000),
    []
  );

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
              Believe in something
            </p>
            <div className="flex justify-center">
              <GlowBorder disabled>
                <button 
                  className="px-8 py-3 text-lg text-green-400 font-bold whitespace-nowrap"
                  disabled
                >
                  Launch Token (Coming Sewn)
                </button>
              </GlowBorder>
            </div>
          </div>
        </div>
      </div>

      {/* HighLites section */}
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

      {/* Tokens section */}
      <div className="w-full py-16">
        <div className="max-w-7xl mx-auto px-4">
          <TokenFilters
            filters={filters}
            onFilterChange={handleFilterUpdate}
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onClearSearch={clearSearch}
          />
          
          <TokenDisplay
            tokens={getDisplayTokens()}
            category={selectedCategory}
            isLoading={tokensLoading || isSearching || filterLoading}
            filterKey={filterKey}
            onTokenClick={handleTokenClick}
          />
        </div>
      </div>
    </div>
  );
} 