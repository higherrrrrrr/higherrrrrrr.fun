import Image from 'next/image';
import Link from 'next/link';
import { getEthPrice } from '../api/price';
import { useState, useEffect } from 'react';

// Add a loading skeleton component
const TokenCardSkeleton = () => (
  <div className="block p-6 border border-green-500/20 rounded-lg animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="flex-1 min-w-0">
        <div className="h-7 bg-green-500/20 w-32 rounded mb-2" />
        <div className="h-5 bg-green-500/20 w-48 rounded mb-4" />
        <div className="mt-4">
          <div className="h-4 bg-green-500/20 w-24 rounded mb-1" />
          <div className="h-5 bg-green-500/20 w-32 rounded" />
        </div>
        <div className="mt-3">
          <div className="h-4 bg-green-500/20 w-full rounded mb-1" />
          <div className="h-1.5 bg-green-500/20 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export default function TokenCard({ token, tokenState, isLoading }) {
  if (isLoading) {
    return <TokenCardSkeleton />;
  }

  const isComingSoon = token.status === 'coming-soon';
  
  // Calculate bonding progress if applicable
  const bondingProgress = tokenState?.marketType === 'bonding_curve' 
    ? (tokenState.currentPrice / tokenState.priceLevels[tokenState.priceLevels.length - 1]) * 100 
    : null;

  return (
    <Link 
      href={`/token/${token.address || token.slug}`}
      className="block border border-green-500/20 rounded-lg p-4 hover:border-green-500/40 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{token.symbol || token.ticker}</h3>
          <p className="text-green-500/60">{token.name}</p>
        </div>
        {isComingSoon ? (
          <div className="text-right">
            <div className="text-sm text-green-500/50">Launch Date</div>
            <div className="text-lg">{new Date(token.launchDate).toLocaleDateString()}</div>
          </div>
        ) : tokenState && (
          <div className="text-right">
            <div className="text-sm text-green-500/50">Price</div>
            <div className="text-lg">${tokenState.price}</div>
          </div>
        )}
      </div>

      {/* Market Stats */}
      {tokenState && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-green-500/70">Market Cap</span>
            <span>${formatMarketCap(tokenState.marketCap)}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-green-500/70">Supply</span>
            <span>{((parseFloat(tokenState.totalSupply) / 1_000_000_000) * 100).toFixed(2)}%</span>
          </div>

          {/* Add social links if available */}
          {(token.twitter || token.telegram || token.website) && (
            <div className="flex gap-2 mt-2">
              {token.twitter && (
                <a href={token.twitter} target="_blank" rel="noopener noreferrer" 
                   className="text-green-500/70 hover:text-green-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              {token.telegram && (
                <a href={token.telegram} target="_blank" rel="noopener noreferrer"
                   className="text-green-500/70 hover:text-green-500">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .24z"/>
                  </svg>
                </a>
              )}
            </div>
          )}

          {/* Bonding Curve Progress */}
          {bondingProgress !== null && (
            <div className="mt-4">
              <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.min(bondingProgress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-green-500/50 mt-1 text-right">
                {bondingProgress.toFixed(1)}% to Uniswap
              </div>
            </div>
          )}
        </div>
      )}
    </Link>
  );
}

// Helper function for formatting market cap
function formatMarketCap(cap) {
  if (cap >= 1_000_000_000) return `${(cap / 1_000_000_000).toFixed(2)}B`;
  if (cap >= 1_000_000) return `${(cap / 1_000_000).toFixed(2)}M`;
  if (cap >= 1_000) return `${(cap / 1_000).toFixed(2)}K`;
  return cap.toFixed(2);
} 