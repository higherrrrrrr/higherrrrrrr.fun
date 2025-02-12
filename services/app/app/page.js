// pages/index.js

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { GlitchText } from '../components/GlitchText';
import { formatCountdown } from '../utils/formatters';
import { getHighliteProjects } from '../utils/projects';
import { SnakeBorder } from '../components/SnakeBorder';

export default function Home() {
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
              <SnakeBorder disabled>
                <button 
                  className="px-8 py-3 text-lg text-green-400 font-bold whitespace-nowrap"
                  disabled
                >
                  Launch Token (Coming Soon)
                </button>
              </SnakeBorder>
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
    </div>
  );
}