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

  // Calculate bonding progress if applicable
  const bondingProgress = tokenState?.marketType === 'bonding_curve' 
    ? (tokenState.currentPrice / tokenState.priceLevels[tokenState.priceLevels.length - 1]) * 100 
    : null;

  return (
    <Link 
      href={`/token/${token.address}`}
      className="block border border-green-500/20 rounded-lg p-4 hover:border-green-500/40 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold">{token.symbol}</h3>
          <p className="text-green-500/60">{token.name}</p>
        </div>
        {tokenState && (
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