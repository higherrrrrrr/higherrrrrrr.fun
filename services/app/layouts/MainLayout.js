// layouts/MainLayout.js

import { useEffect, useState } from 'react';
import { ConnectButton } from '../components/Web3Provider';
import Link from 'next/link';
import TVPanel from '../components/TVPanel';
import TermsModal from '../components/TermsModal';

export default function MainLayout({ children }) {
  const [isMobile, setIsMobile] = useState(false);
  const [tvEnabled, setTvEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tvEnabled');
      // Default to false (trading mode) on first visit if you prefer
      return stored === null ? false : stored === 'true';
    }
    return false;
  });

  // Toggle TV mode and save state
  const toggleTV = () => {
    const newState = !tvEnabled;
    setTvEnabled(newState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tvEnabled', newState);
    }
  };

  // Listen for window resize to detect mobile/desktop if needed
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col relative">
      <TermsModal />

      {/* HEADER - Only show full header when TV is disabled or on desktop */}
      {(!tvEnabled || !isMobile) && (
        <header className="sticky top-0 z-50 bg-black border-b border-green-500/20 flex flex-col md:flex-row justify-between items-center p-3 md:p-6 max-w-[1920px] mx-auto w-full gap-4 md:gap-0">
          <div className="flex items-center gap-6">
            <Link href="/">
              <h1 className="text-3xl font-mono font-bold text-green-500 hover:text-green-400 transition-colors cursor-pointer">
                Higher<sup className="text-lg">7</sup>
              </h1>
            </Link>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/theology" className="text-green-500 hover:text-green-400 transition-colors font-mono">
                Theology
              </Link>
              <Link href="/how-it-works" className="text-green-500 hover:text-green-400 transition-colors font-mono">
                How it Works
              </Link>
              <Link href="/featured/feed" className="hover:text-green-300 transition-colors">
                HighLites
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
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z" />
                </svg>
              </a>
            </nav>
          </div>

          <div className="flex gap-3 md:gap-4 items-center">
            {/* Desktop TV Toggle */}
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
                <button className="snake-border w-full h-12 px-4 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-all duration-200 whitespace-nowrap text-base">
                  Create
                </button>
              </Link>
            </div>
            <div className="w-[180px] h-12">
              <ConnectButton className="snake-border" />
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex md:hidden flex-col items-center gap-4 w-full">
            <div className="flex items-center gap-4 justify-center w-full">
              <Link href="/theology" className="text-green-500 hover:text-green-400 transition-colors font-mono">
                Theology
              </Link>
              <Link href="/how-it-works" className="text-green-500 hover:text-green-400 transition-colors font-mono">
                How it Works
              </Link>
              <Link href="/featured/feed" className="text-green-500 hover:text-green-400 transition-colors font-mono">
                HighLites
              </Link>
            </div>
            <div className="flex items-center gap-2 justify-center w-full">
              <span className="text-sm text-green-500/70 font-mono">TV</span>
              <button
                onClick={toggleTV}
                aria-pressed={tvEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  tvEnabled ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                    tvEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </nav>
        </header>
      )}

      {/* Mobile TV Toggle - Show only when in TV mode on mobile */}
      {isMobile && tvEnabled && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-black/80 p-3 flex justify-center items-center gap-2">
          <span className="text-sm text-green-500/70 font-mono">TV</span>
          <button
            onClick={toggleTV}
            aria-pressed={tvEnabled}
            className="relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none bg-green-500"
          >
            <span className="inline-block h-6 w-6 transform rounded-full bg-black transition-transform translate-x-7" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main className={`flex-grow relative ${tvEnabled && isMobile ? 'pt-14' : ''}`}>
        {tvEnabled ? (
          isMobile ? (
            // Mobile TV mode: full viewport
            <div className="fixed inset-0 z-0">
              <TVPanel className="w-full h-full" />
            </div>
          ) : (
            // Desktop TV mode: split view with separate scrolling
            <div className="max-w-[1920px] mx-auto px-3 md:px-6 py-4 md:py-8 w-full grid grid-cols-3 gap-6 relative">
              {/* Left column: scrollable content - takes up 2/3 */}
              <div className="col-span-2 overflow-y-auto max-h-[calc(100vh-8rem)] min-h-[1400px]">
                {children}
              </div>
              {/* Right column: TV panel - takes up 1/3 */}
              <div className="col-span-1">
                <div className="sticky top-6">
                  <div className="border border-green-500/20 rounded-lg overflow-hidden bg-black/50 h-[calc(100vh-8rem)]">
                    <TVPanel className="w-full h-full" />
                  </div>
                </div>
              </div>
            </div>
          )
        ) : (
          // Trading interface mode (non-TV)
          <div className="max-w-[1920px] mx-auto px-3 md:px-6 py-4 md:py-8 relative z-10">
            <div className="overflow-y-auto max-h-[calc(100vh-8rem)] min-h-[1400px]">
              {children}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER - Hide when TV is enabled on mobile */}
      {(!tvEnabled || !isMobile) && (
        <footer className="border-t border-green-500/20 mt-auto z-50">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-3 md:py-4 flex justify-between items-center">
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
                href="https://t.me/higherrrrrrrfun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500/50 hover:text-green-500 font-mono text-xs md:text-sm transition-colors"
              >
                Telegram
              </a>
              <a
                href="https://github.com/higherrrrrrr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-500/50 hover:text-green-500 font-mono text-xs md:text-sm transition-colors"
              >
                GitHub
              </a>
              <a
                href="/tos"
                rel="noopener noreferrer"
                className="text-green-500/50 hover:text-green-500 font-mono text-xs md:text-sm transition-colors"
              >
                Terms of Service
              </a>
            </div>
            <div className="text-green-500/50 font-mono text-xs md:text-sm">
              Built on <span className="line-through mx-1">Base</span> Solana
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
