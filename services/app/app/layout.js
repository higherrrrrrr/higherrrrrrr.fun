"use client";

import "../styles/globals.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import DynamicProvider from "../components/DynamicProvider";
import TVPanel from "../components/TVPanel";
import TermsModal from "../components/TermsModal";
import DynamicConnectButton from "../components/DynamicConnectButton";
import { WagmiProvider, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  // Determine mobile viewport
  const [isMobile, setIsMobile] = useState(false);

  // Read saved TV mode state from localStorage
  const [tvEnabled, setTvEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("tvEnabled");
      return stored === null ? false : stored === "true";
    }
    return false;
  });
 
  const toggleTV = () => {
    const newState = !tvEnabled;
    setTvEnabled(newState);
    if (typeof window !== "undefined") {
      localStorage.setItem("tvEnabled", newState);
    }
  };

  // Listen for window resizes to determine mobile vs. desktop
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <html lang="en">
      <head>
        <title>higherrrrrrr.fun</title>
        <link rel="icon" href="/icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <DynamicProvider>
              <div className="min-h-screen bg-black flex flex-col relative">
                <TermsModal />

                {/* HEADER: Render when TV mode is off or on desktop */}
                {(!tvEnabled || !isMobile) && (
                  <header className="sticky top-0 z-50 bg-black border-b border-green-500/30 flex flex-col md:flex-row justify-between items-center p-3 md:p-6 max-w-[1920px] mx-auto w-full gap-4 md:gap-0">
                    {/* Left side - Logo and Navigation */}
                    <div className="flex items-center gap-6">
                      <Link
                        href="/"
                        className="text-3xl font-mono font-bold text-green-500 hover:text-green-400 transition-colors cursor-pointer"
                      >
                        HIGHER⁷
                      </Link>
                      {/* Desktop Navigation */}
                      <nav className="hidden md:flex items-center gap-6">
                        <Link
                          href="/how-it-works"
                          className="text-green-500 hover:text-green-400 transition-colors font-mono"
                        >
                          How it Works
                        </Link>
                        <Link
                          href="/featured/feed"
                          className="text-green-500 hover:text-green-400 transition-colors font-mono"
                        >
                          HighLites
                        </Link>
                      </nav>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex gap-3 md:gap-4 items-center">
                      {/* Desktop TV Toggle */}
                      <div className="hidden md:flex items-center gap-2">
                        <span className="text-green-500 font-mono">TV</span>
                        <button
                          onClick={toggleTV}
                          className={`
                            px-2 py-1 rounded-full border border-green-500 font-mono text-xs
                            ${tvEnabled ? "bg-green-500 text-black" : "bg-black text-green-500"}
                          `}
                        >
                          {tvEnabled ? "ON" : "OFF"}
                        </button>
                      </div>
                      <div className="h-10">
                        <DynamicConnectButton />
                      </div>
                    </div>

                    {/* Mobile Navigation */}
                    <nav className="flex md:hidden flex-col items-center gap-4 w-full mt-4">
                      <div className="flex items-center gap-4 justify-center w-full">
                        <Link
                          href="/how-it-works"
                          className="text-green-500 hover:text-green-400 transition-colors font-mono"
                        >
                          How It Works
                        </Link>
                        <Link
                          href="/featured/feed"
                          className="text-green-500 hover:text-green-400 transition-colors font-mono"
                        >
                          HighLites
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 justify-center w-full">
                        <span className="text-sm text-green-500/70 font-mono">TV</span>
                        <button
                          onClick={toggleTV}
                          aria-pressed={tvEnabled}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                            tvEnabled ? "bg-green-500" : "bg-gray-600"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-black transition-transform ${
                              tvEnabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </nav>
                  </header>
                )}

                {/* MAIN CONTENT */}
                <main className={`flex-grow relative ${tvEnabled && isMobile ? "pt-14" : ""}`}>
                  {tvEnabled ? (
                    isMobile ? (
                      // Mobile TV mode: full viewport TV panel
                      <div className="fixed inset-0 z-0">
                        <TVPanel className="w-full h-full" />
                      </div>
                    ) : (
                      // Desktop TV mode: split view
                      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8 grid grid-cols-3 gap-6 relative">
                        <div className="col-span-2 overflow-y-auto max-h-[calc(100vh-8rem)]">
                          {children}
                        </div>
                        <div className="col-span-1">
                          <div className="sticky top-6">
                            <div className="border border-green-500/30 rounded-lg overflow-hidden bg-black/50 h-[calc(100vh-8rem)]">
                              <TVPanel className="w-full h-full" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  ) : (
                    // Normal (non-TV) layout
                    <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">{children}</div>
                  )}
                </main>

                {/* FOOTER: Only show when not in full mobile TV mode */}
                {(!tvEnabled || !isMobile) && (
                  <footer className="border-t border-green-500/30 mt-auto">
                    <div className="max-w-[1920px] mx-auto px-3 md:px-6 py-3 md:py-4">
                      <div className="flex flex-col md:flex-row md:justify-between items-center gap-3 md:gap-0">
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6">
                          <Link
                            href="/plex"
                            className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                          >
                            Plex
                          </Link>
                          <a
                            href="https://x.com/higherrrrrrrfun"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                          >
                            Twitter
                          </a>
                          <a
                            href="https://t.me/higherrrrrrrfun"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                          >
                            Telegram
                          </a>
                          <a
                            href="https://github.com/higherrrrrrr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                          >
                            GitHub
                          </a>
                          <Link
                            href="/tos"
                            className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                          >
                            Terms of Service
                          </Link>
                        </div>
                        <div className="text-green-500/60 font-mono text-xs">
                          Built on <span className="line-through mx-1">Base</span> Solana
                        </div>
                      </div>
                    </div>
                  </footer>
                )}
              </div>
            </DynamicProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
