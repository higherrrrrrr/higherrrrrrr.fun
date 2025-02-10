"use client";

import "../styles/globals.css";
import { useState, useEffect } from "react";
import Link from "next/link";
import DynamicProvider from "../components/DynamicProvider";
import TVPanel from "../components/TVPanel";
import DynamicConnectButton from "../components/DynamicConnectButton";
import { WagmiProvider, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';
import ClientOnly from "../components/ClientOnly";
import Script from 'next/script';
import posthog from 'posthog-js';
import { usePathname, useSearchParams } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import { ClientLayout } from '@/components/ClientLayout';
import { SolanaProvider } from '@/components/SolanaProvider';

// PostHog initialization
if (typeof window !== 'undefined') {
  posthog.init('phc_QObbSAeS9Bc3rBhOtDD0M5JUp5RDmPDQZVsmNQVXnFp', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug();
      }
      // Force reload feature flags
      posthog.reloadFeatureFlags();
    }
  });
}

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http("https://base-mainnet.g.alchemy.com/v2/jFjopZDrbRnD8hRKINkO7BOwW9YH9iLD"),
  },
});

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track page views
  useEffect(() => {
    if (pathname) {
      posthog.capture('$pageview');
    }
  }, [pathname, searchParams]);

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
        <link rel="icon" href="/icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Primary Meta Tags */}
        <meta name="title" content="HIGHER⁷" />
        <meta name="description" content="Trade on higherrrrrrr.fun - The most fun way to trade on Solana" />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://higherrrrrrr.fun/" />
        <meta property="og:title" content="HIGHER⁷" />
        <meta property="og:description" content="Trade on higherrrrrrr.fun - the future of social trading" />
        <meta property="og:image" content="https://higherrrrrrr.fun/social-preview.png" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://higherrrrrrr.fun/" />
        <meta property="twitter:title" content="HIGHER⁷" />
        <meta property="twitter:description" content="Trade on higherrrrrrr.fun - The most fun way to trade on Solana" />
        <meta property="twitter:image" content="https://higherrrrrrr.fun/social-preview.png" />
        
        {/* Load Twitch script once, at the layout level */}
        <Script 
          src="https://embed.twitch.tv/embed/v1.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <ClientOnly>
          <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
              <DynamicProvider>
                <SolanaProvider>
                  <ClientLayout>
                    <div className="min-h-screen bg-black flex flex-col relative">

                      {/* HEADER: Modified mobile header for TV mode */}
                      {isMobile && tvEnabled ? (
                        <>
                          <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-green-500/30 flex justify-between items-center px-4 py-3">
                            <Link
                              href="/"
                              className="flex items-center gap-2 text-2xl font-mono font-bold text-green-500"
                            >
                              <img src="/icon.png" alt="Higher Logo" className="w-6 h-6" />
                              HIGHER⁷
                            </Link>
                            <div className="flex items-center gap-2">
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
                          </header>
                          <footer className="fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-t border-green-500/30">
                            <div className="px-4 py-3">
                              <div className="flex justify-between items-center">
                                <div className="text-green-500/60 font-mono text-xs">
                                  Built on <span className="line-through mx-1">Base</span> Solana
                                </div>
                                <Link
                                  href="/plex"
                                  className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                                >
                                  Plex
                                </Link>
                              </div>
                            </div>
                          </footer>
                        </>
                      ) : (
                        // Original header for non-TV mode or desktop
                        (!tvEnabled || !isMobile) && (
                          <header className="sticky top-0 z-50 bg-black border-b border-green-500/30 flex flex-col md:flex-row justify-between items-center p-3 md:p-6 max-w-[1920px] mx-auto w-full gap-4 md:gap-0">
                            {/* Left side - Logo and Navigation */}
                            <div className="flex items-center gap-6">
                              <Link
                                href="/"
                                className="flex items-center gap-2 text-3xl font-mono font-bold text-green-500 hover:text-green-400 transition-colors cursor-pointer"
                              >
                                <img src="/icon.png" alt="Higher Logo" className="w-8 h-8" />
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
                                <Link
                                  href="/profile"
                                  className="text-green-500 hover:text-green-400 transition-colors font-mono"
                                >
                                  Profile
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
                                <Link
                                  href="/profile"
                                  className="text-green-500 hover:text-green-400 transition-colors font-mono"
                                >
                                  Profile
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
                        )
                      )}

                      {/* MAIN CONTENT */}
                      <main className={`flex-grow relative ${tvEnabled && isMobile ? "pt-12 pb-12" : ""}`}>
                        {tvEnabled ? (
                          isMobile ? (
                            // Mobile TV mode: full viewport TV panel with padding for header/footer
                            <div className="fixed inset-x-0 top-12 bottom-12 z-0">
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
                                <Link
                                  href="/base"
                                  className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                                >
                                  Base Tokens
                                </Link>
                                <Link
                                  href="/support"
                                  className="text-green-500/60 hover:text-green-500 font-mono text-xs"
                                >
                                  Support
                                </Link>
                              </div>
                              <div className="flex items-center">
                                <img 
                                  src="/powered-by.svg" 
                                  alt="Powered by Solana" 
                                  className="h-6 opacity-60 hover:opacity-100 transition-opacity"
                                />
                              </div>
                            </div>
                          </div>
                        </footer>
                      )}
                    </div>
                  </ClientLayout>
                </SolanaProvider>
                <Toaster 
                  position="bottom-right"
                  toastOptions={{
                    style: {
                      background: '#000',
                      color: '#22c55e',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                    },
                    success: {
                      duration: 3000,
                    },
                    error: {
                      duration: 5000,
                      style: {
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                      },
                    },
                  }}
                />
              </DynamicProvider>
            </QueryClientProvider>
          </WagmiProvider>
        </ClientOnly>
      </body>
    </html>
  );
}
