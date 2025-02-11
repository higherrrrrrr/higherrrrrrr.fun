import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { usePrice } from '../hooks/usePrice';
import { formatMarketCap } from '../utils/format';

// Loading skeleton
const TokenCardSkeleton = () => (
  <div className="block p-6 border border-green-500/20 rounded-lg animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-green-500/20 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-7 bg-green-500/20 w-32 rounded mb-2" />
        <div className="h-5 bg-green-500/20 w-48 rounded" />
      </div>
    </div>
  </div>
);

export default function TokenCard({ token, tokenState, isLoading }) {
  const { price: ethPrice, loading: priceLoading } = usePrice();
  const [marketCap, setMarketCap] = useState('...');

  useEffect(() => {
    if (tokenState && ethPrice) {
      const priceInEth = parseFloat(tokenState.currentPrice);
      const usdPrice = priceInEth * ethPrice;
      const totalSupply = parseFloat(tokenState.totalSupply);
      const mcap = usdPrice * totalSupply;
      setMarketCap(isNaN(mcap) ? '0' : formatMarketCap(mcap));
    }
  }, [tokenState, ethPrice]);

  if (isLoading || !token || priceLoading) {
    return <TokenCardSkeleton />;
  }

  const dexScreenerUrl = `https://dexscreener.com/base/${token.address}`;

  return (
    <Link
      href={dexScreenerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-6 border border-green-500/20 rounded-lg hover:border-green-500/40 transition-colors hover:bg-green-500/5"
    >
      <div className="flex items-start space-x-4">
        {token.image && (
          <div className="w-12 h-12 relative rounded-full overflow-hidden flex-shrink-0">
            <Image
              src={token.image}
              alt={token.symbol}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-mono text-green-500 mb-1 truncate">
            ${tokenState?.symbol || token.symbol}
          </p>
          
          <div className="text-sm text-green-500/60">
            <span className="font-mono">{marketCap}</span>
          </div>
          
          {/* Deprecation Warning */}
          <div className="mt-2 text-xs text-yellow-500/80 bg-yellow-500/10 px-2 py-1 rounded">
            ⚠️ Deprecated Pending Migration: Use DexScreener for accurate data
          </div>
          
          <div className="mt-3 text-xs text-green-500/40">
            View on DexScreener →
          </div>
        </div>
      </div>
    </Link>
  );
} 