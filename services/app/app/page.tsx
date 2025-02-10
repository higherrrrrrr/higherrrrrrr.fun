// pages/index.js

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlitchText } from '../components/GlitchText';
import { formatCountdown } from '../utils/formatters';
import { getHighliteProjects } from '../utils/projects';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { SolanaErrorBoundary } from '@/components/SolanaErrorBoundary';
import TokenScreenerSkeleton from '../components/TokenScreenerSkeleton';

// Dynamically import TokenScreener to avoid SSR issues
const TokenScreener = dynamic(() => import('../components/TokenScreener'), {
  ssr: false,
  loading: () => <TokenScreenerSkeleton />
});

export default function Home() {
  const [highliteProjects, setHighliteProjects] = useState([]);

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
              Believe in something
            </p>

            <button 
              className="px-6 py-3 border-2 border-green-500/30 rounded-lg hover:border-green-500 transition-colors text-lg"
              disabled
            >
              Launch Token (Coming Soon)
            </button>
          </div>
        </div>
      </div>

      {/* HighLites */}
      <div className="w-full py-8 border-b border-green-500/20">
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">HighLites</h2>
            <Link 
              href="/featured/feed"
              className="text-sm px-3 py-1 border border-green-500/30 rounded hover:border-green-500 transition-colors"
            >
              View All
            </Link>
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {highliteProjects.map((project) => (
              <Link 
                key={project.slug} 
                href={`/featured/${project.slug}`} 
                className="block w-[280px]"
              >
                <div className="snake-border p-3 bg-black/20 rounded h-[280px] flex flex-col">
                  {project.imageUrl && (
                    <div className="w-full h-[200px] mb-2 overflow-hidden rounded">
                      <img
                        src={project.imageUrl}
                        alt={project.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex flex-col justify-between flex-grow">
                    <div>
                      <h3 className="text-base font-bold">{project.name}</h3>
                      <p className="text-xs text-green-500/70 line-clamp-1">
                        {project.description}
                      </p>
                    </div>
                    <div className="text-green-300 font-mono text-xs">
                      <span className="opacity-70 mr-1">Launch:</span>
                      {formatCountdown(project.timeLeftMs)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <style jsx>{`
          .snake-border {
            position: relative;
            border: 1px solid rgba(0, 255, 0, 0.15);
            transition: transform 0.3s;
            background: rgba(0, 0, 0, 0.8);
          }
          
          .snake-border:hover {
            transform: scale(1.02);
          }

          .snake-border::after {
            content: "";
            position: absolute;
            top: 4px; left: 4px; right: 4px; bottom: 4px;
            border: 1px solid rgba(0, 255, 0, 0.15);
            border-radius: 4px;
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
            top: -1px; left: -1px; right: -1px; bottom: -1px;
            border-radius: 4px;
            pointer-events: none;
            background: linear-gradient(90deg, #00ff00 50%, transparent 50%) 0 0,
                      linear-gradient(90deg, #00ff00 50%, transparent 50%) 0 100%,
                      linear-gradient(0deg, #00ff00 50%, transparent 50%) 0 0,
                      linear-gradient(0deg, #00ff00 50%, transparent 50%) 100% 0;
            background-repeat: no-repeat;
            background-size: 20px 1px, 20px 1px, 1px 20px, 1px 20px;
            animation: snake-travel 6s infinite linear;
            box-shadow: 0 0 10px rgba(0, 255, 0, 0.2);
          }
        `}</style>
      </div>

      {/* Token Screener */}
      <div className="w-full py-16">
        <div className="max-w-7xl mx-auto px-4">
          <Suspense fallback={<TokenScreenerSkeleton />}>
            <SolanaErrorBoundary>
              <TokenScreener />
            </SolanaErrorBoundary>
          </Suspense>
        </div>
      </div>
    </div>
  );
}