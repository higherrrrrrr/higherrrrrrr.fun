// pages/index.js

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useHomepage } from '../hooks/useHomepage';
import { SolanaTokenCard } from '../components/SolanaTokenCard';
import { GlitchText } from '../components/GlitchText';
import { formatCountdown } from '../utils/formatters';
import { getHighliteProjects } from '../utils/projects';
import { SnakeBorder } from '../components/SnakeBorder.js';

export default function Home() {
  const { majorTokens, memeTokens, vcTokens, loading, error } = useHomepage();
  const [selectedCategory, setSelectedCategory] = useState('meme');
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

  if (error) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Error loading tokens</h2>
          <p className="text-green-400/70">{error}</p>
        </div>
      </div>
    );
  }

  if (!memeTokens?.length && !loading) {
    console.log('No meme tokens found:', {
      memeTokens,
      majorTokens,
      vcTokens,
      loading,
      error
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
              <button 
                className="px-8 py-3 text-lg font-bold whitespace-nowrap rounded border-2 border-green-500 text-green-500/50"
                disabled
              >
                Launch Token (Coming Sewn)
              </button>
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
                <SnakeBorder className="p-6 bg-black/20 h-full flex flex-col">
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
                </SnakeBorder>
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

          {/* Category Tabs */}
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

          {/* Token Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 rounded-lg bg-green-500/5 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {getTokensForCategory().map(token => (
                <div key={token.token_address} className="bg-black border border-green-500/20">
                  <SolanaTokenCard
                    token={token}
                    category={null} // Don't show category badge since we're in categorized view
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