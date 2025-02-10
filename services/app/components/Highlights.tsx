'use client';

import useSWR from 'swr';
import { formatNumber, formatPriceChange, getPriceChangeColor } from '@/lib/format';
import HighlightsSkeleton from './HighlightsSkeleton';

export default function Highlights() {
  const { data: tokens, isLoading, error } = useSWR('/api/tokens/top-trading');

  if (isLoading) return <HighlightsSkeleton />;
  if (error) return null;

  // Get top 3 tokens by volume
  const topTokens = tokens?.slice(0, 3) || [];

  return (
    <>
      {topTokens.map(token => (
        <div key={token.address} className="bg-black border border-green-500/30 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-lg">{token.symbol}</h3>
              <p className="text-sm text-gray-500">{token.name}</p>
            </div>
            <div className={`text-lg ${getPriceChangeColor(token.priceChange24h)}`}>
              {formatPriceChange(token.priceChange24h)}
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-500">Price</span>
              <span>${formatNumber(token.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Volume 24h</span>
              <span>${formatNumber(token.volume24h)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Market Cap</span>
              <span>${formatNumber(token.marketCap)}</span>
            </div>
          </div>
        </div>
      ))}
    </>
  );
} 