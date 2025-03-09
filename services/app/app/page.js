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
import { SolanaTokenList } from '../components/SolanaTokenCard';
import { useTokenFilter } from '../hooks/useTokenFilter';
import { TokenFilters } from '../components/TokenFilters';
import { TokenDisplay } from '../components/TokenDisplay';
import { processTokens } from '../utils/tokenProcessing';
import { recordJupiterSwap } from '@/lib/jupiterIntegration';

export default function Home() {
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

  // Add this near your other state declarations
  const filterKey = JSON.stringify({
    filters,
    selectedCategory,
    searchQuery
  });

  // Handle search changes without hiding UI elements
  const handleSearchChange = (value) => {
    handleSearch(value);
    // Reset filters and update category when searching
    updateFilters({
      ...filters,
      page: 1,
      category: selectedCategory
    });
  };

  // Determine which tokens to display
  const getDisplayTokens = () => {
    let displayTokens;

    // Get base tokens based on category and filters
    if (tokens && Object.values(filters).some(v => v)) {
      displayTokens = tokens; // These are already processed by useTokenFilter
    } else {
      // Combine and process tokens based on category
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
          // Deduplicate tokens when combining all categories
          const allTokens = [...majorTokens, ...memeTokens, ...vcTokens];
          const uniqueTokens = Array.from(new Map(allTokens.map(token => 
            [token.token_address, token]
          )).values());
          displayTokens = processTokens(uniqueTokens, { sortBy: filters.sortBy });
      }
    }

    // Apply search if query exists, maintaining sort preferences
    return searchQuery ? searchTokens(displayTokens, searchQuery) : displayTokens;
  };

  // Update filters while maintaining search state
  const handleFilterUpdate = (newFilters) => {
    updateFilters({
      ...newFilters,
      page: 1,
      category: selectedCategory
    });
  };

  // Update category while maintaining search state
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    updateFilters({
      ...filters,
      category,
      page: 1
    });
    // Don't clear search when changing category
  };

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

  // Add handler for token clicks
  const handleTokenClick = useCallback((token) => {
    if (typeof window !== 'undefined' && window.Jupiter) {
      try {
        // Initialize Jupiter Terminal with default SOL -> token but allow full customization
        window.Jupiter.init({
          endpoint: "https://netti-iof1ud-fast-mainnet.helius-rpc.com",
          displayMode: "modal",
          defaultExplorer: "Solana Explorer",
          strictTokenList: false,
          formProps: {
            // Set default input as SOL but allow changing
            initialInputMint: "So11111111111111111111111111111111111111112", // SOL
            fixedInputMint: false, // Allow changing input token

            // Set clicked token as default output but allow changing
            initialOutputMint: token.address || token.token_address,
            fixedOutputMint: false, // Allow changing output token

            // Default to ExactIn mode - users specify how much they want to spend
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

  const handleClearAll = () => {
    // Reset category
    setSelectedCategory('all');
    // Reset filters to default
    updateFilters({
      minVolume: 0,
      maxVolume: Infinity,
      minHolders: 0,
      maxHolders: Infinity,
      minTransactionSize: 0,
      minTrades: 0,
      minAge: null,
      maxAge: null,
      sortBy: 'volume',
      sortDir: 'desc',
      category: null,
      preset: null,
      page: 1,
      perPage: 12
    });
  };

  // Add a separate function for clearing search
  const handleClearSearch = () => {
    clearSearch();
    // Don't reset filters, only update the page
    updateFilters({
      ...filters,
      page: 1
    });
  };

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
          <div className="mb-8 relative">
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Search by name, symbol, or address..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="flex-1 px-4 py-2 bg-black border border-green-500/20 rounded-lg 
                         text-green-500 placeholder-green-500/50 focus:outline-none 
                         focus:border-green-500/50 transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="px-4 py-2 text-green-500/70 hover:text-green-500 
                           transition-colors rounded-lg border border-green-500/20"
                >
                  Clear Search
                </button>
              )}
            </div>
            {searchError && (
              <p className="mt-2 text-red-500 text-sm">{searchError}</p>
            )}
          </div>

          {/* Category Tabs - Always visible */}
          <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
            <button
              onClick={() => handleCategoryChange('all')}
              className={`px-6 py-2 rounded-lg ${
                selectedCategory === 'all'
                  ? 'bg-green-500 text-black'
                  : 'bg-green-500/10 hover:bg-green-500/20'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleCategoryChange('meme')}
              className={`px-6 py-2 rounded-lg ${
                selectedCategory === 'meme'
                  ? 'bg-green-500 text-black'
                  : 'bg-green-500/10 hover:bg-green-500/20'
              }`}
            >
              Meme
            </button>
            <button
              onClick={() => handleCategoryChange('major')}
              className={`px-6 py-2 rounded-lg ${
                selectedCategory === 'major'
                  ? 'bg-green-500 text-black'
                  : 'bg-green-500/10 hover:bg-green-500/20'
              }`}
            >
              Major
            </button>
            <button
              onClick={() => handleCategoryChange('vc')}
              className={`px-6 py-2 rounded-lg ${
                selectedCategory === 'vc'
                  ? 'bg-green-500 text-black'
                  : 'bg-green-500/10 hover:bg-green-500/20'
              }`}
            >
              VC
            </button>
          </div>

          {/* Filters - Always visible */}
          <TokenFilters 
            filters={filters}
            onUpdateFilters={handleFilterUpdate}
            onClearAll={handleClearAll}
          />

          {/* Token Display - Update to use handleTokenClick */}
          <TokenDisplay
            tokens={getDisplayTokens()}
            category={selectedCategory}
            isLoading={searchQuery ? isSearching : tokensLoading}
            filterKey={filterKey}
            onTokenClick={handleTokenClick}
          />
        </div>
      </div>
    </div>
  );
}

// Define fetcher if not already defined
const fetcher = url => fetch(url).then(res => res.json());