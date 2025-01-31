// layouts/MainLayout.js

import { useEffect, useState } from 'react';
import { ConnectKitButton } from '../components/Web3Provider';
import Link from 'next/link';
import TVPanel from '../components/TVPanel';
import featuredProjects from '../data/featuredProjects';

export default function MainLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(() => {
    // Only run this on client-side
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tvEnabled');
      // If no stored value (first visit), return true
      return stored === null ? true : stored === 'true';
    }
    return true; // Default to true for SSR
  });

  // Save TV state to localStorage when it changes
  const toggleTV = () => {
    const newState = !tvEnabled;
    setTvEnabled(newState);
    localStorage.setItem('tvEnabled', newState);
  };

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Make header sticky */}
      <header className="sticky top-0 z-50 bg-black border-b border-green-500/20 flex flex-col md:flex-row justify-between items-center p-3 md:p-6 max-w-[1920px] mx-auto w-full gap-4 md:gap-0">
        <div className="flex items-center gap-6">
          <Link href="/">
            <h1 className="text-3xl font-mono font-bold text-green-500 hover:text-green-400 transition-colors cursor-pointer">
              Higher<sup className="text-lg">7</sup>
            </h1>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/theology"
              className="text-green-500 hover:text-green-400 transition-colors font-mono"
            >
              Theology
            </Link>
            <Link 
              href="/how-it-works"
              className="text-green-500 hover:text-green-400 transition-colors font-mono"
            >
              How it Works
            </Link>
            <Link href="/featured/feed" className="hover:text-green-300 transition-colors">
              Featured
            </Link>
            <a 
              href="https://x.com/higherrrrrrrfun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a 
              href="https://t.me/higherrrrrrrfun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
              </svg>
            </a>
          </nav>
        </div>

        {/* Right section: "TV" toggle + "Create" + Connect button */}
        <div className="flex gap-3 md:gap-4 items-center">
          {/* TV Toggle - hidden on mobile */}
          <div className="hidden md:flex items-center gap-2">
            <label htmlFor="tv-toggle" className="text-sm text-green-500/70 font-mono">
              TV
            </label>
            <button
              id="tv-toggle"
              type="button"
              onClick={toggleTV}
              className={`
                relative inline-flex items-center h-6 px-2 py-1 rounded-full border
                ${tvEnabled ? 'bg-green-500 border-green-500 text-black' : 'bg-black text-green-500 border-green-500/50'}
                font-mono text-xs
              `}
            >
              {tvEnabled ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="w-[180px]">
            <Link href="/launch" className="w-full">
              <button className="w-full h-12 px-4 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors whitespace-nowrap text-base">
                Create
              </button>
            </Link>
          </div>
          <div className="w-[180px] h-12">
            <ConnectKitButton />
          </div>
        </div>

        {/* Mobile nav menu */}
        <nav className="flex md:hidden items-center gap-4 w-full justify-center">
          <Link 
            href="/theology"
            className="text-green-500 hover:text-green-400 transition-colors font-mono"
          >
            Theology
          </Link>
          <Link 
            href="/how-it-works"
            className="text-green-500 hover:text-green-400 transition-colors font-mono"
          >
            How it Works
          </Link>
          <a 
            href="https://x.com/higherrrrrrrfun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a 
            href="https://t.me/higherrrrrrrfun"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-500 hover:text-green-400 transition-colors"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
            </svg>
          </a>
        </nav>
      </header>

      {/* MAIN: If TV is ON, show a 2-col layout (left = main content, right = TV) */}
      <main
        className={
          tvEnabled && !isMobile
            ? "flex-grow max-w-[1920px] mx-auto px-3 md:px-6 py-4 md:py-8 w-full grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6 relative"
            : "flex-grow max-w-[1920px] mx-auto px-3 md:px-6 py-4 md:py-8 w-full"
        }
      >
        {/* Left column: normal page content - scrollable container */}
        <div className="col-span-1 overflow-y-auto max-h-[calc(100vh-8rem)] min-h-[1400px]">
          {children}
        </div>

        {/* Right column: TV panel (only if tvEnabled and not mobile) */}
        {tvEnabled && !isMobile && (
          <div className="col-span-1">
            <div className="h-[1000px] sticky top-6">
              <TVPanel />
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-green-500/20 mt-auto">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4 flex justify-between items-center">
          {/* Left links */}
          <div className="flex gap-6">
            <Link 
              href="/plex"
              className="text-green-500/50 hover:text-green-500 font-mono text-xs md:text-sm transition-colors"
            >
              Plex
            </Link>
            <a 
              href="https://x.com/higherrrrrrrfun"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500/50 hover:text-green-500 font-mono text-xs md:text-sm transition-colors"
            >
              Twitter
            </a>
            <a
              href="https://github.com/higherrrrrrr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500/50 hover:text-green-500 font-mono text-xs md:text-sm transition-colors"
            >
              GitHub
            </a>
          </div>

          {/* Center text */}
          <div className="text-green-500/50 font-mono text-xs md:text-sm">
            8=====D ~~~~~ 👧
          </div>

          {/* Right text */}
          <div className="text-green-500/50 font-mono text-xs md:text-sm">
            Built on <span className="line-through mx-1">Base</span> Solana
          </div>
        </div>
      </footer>
    </div>
  );
}
