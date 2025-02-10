import Image from 'next/image';
import Link from 'next/link';
import { getEthPrice } from '@/lib/client-api';
import type { Token } from '@/lib/types';
import { useState, useEffect } from 'react';

interface TokenCardProps {
  token: Token;
  loading?: boolean;
}

export function TokenCardSkeleton() {
  return (
    <div className="block p-6 border border-green-500/20 rounded-lg animate-pulse">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-green-500/20 rounded-full flex-shrink-0" />
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
          <div className="mt-3">
            <div className="h-6 bg-green-500/20 w-40 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TokenCard({ token, loading }: TokenCardProps) {
  const [marketCap, setMarketCap] = useState('...');
  const [stateInfo, setStateInfo] = useState({ current: null, next: null, currentPrice: null, nextPrice: null });

  useEffect(() => {
    if (token.priceLevels) {
      const currentIndex = token.priceLevels.findIndex(level => level.name === token.name);
      const currentState = token.priceLevels[currentIndex];
      const nextState = token.priceLevels[currentIndex + 1];

      setStateInfo({
        current: currentState?.name || token.name,
        next: nextState?.name || 'FINAL FORM',
        currentPrice: parseFloat(token.currentPrice),
        nextPrice: nextState?.price || currentState?.price
      });
    }
  }, [token.priceLevels, token.currentPrice, token.name]);

  useEffect(() => {
    getMarketCap(token).then(cap => setMarketCap(cap));
  }, [token]);

  const getMarketCap = async (token: Token) => {
    if (!token) return '0';
    
    try {
      const priceInEth = parseFloat(token.currentPrice);
      const ethPrice = await getEthPrice();
      
      const usdPrice = priceInEth * ethPrice;
      const totalSupply = parseFloat(token.totalSupply);
      const marketCapUsd = usdPrice * totalSupply;
      
      if (isNaN(marketCapUsd)) return '0';
      return Math.floor(marketCapUsd).toLocaleString();
    } catch (error) {
      return '0';
    }
  };

  const getProgress = (token: Token) => {
    if (!token.priceLevels || !token.currentPrice) return 0;
    
    const currentIndex = token.priceLevels.findIndex(level => level.name === token.name);
    const currentPrice = parseFloat(token.currentPrice);
    const currentThreshold = parseFloat(token.priceLevels[currentIndex]?.price || '0');
    const nextThreshold = parseFloat(token.priceLevels[currentIndex + 1]?.price || currentThreshold.toString());
    
    if (currentThreshold === nextThreshold) return 100;
    
    const progress = ((currentPrice - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  if (loading || !token) {
    return <TokenCardSkeleton />;
  }

  return (
    <Link
      href={`/token/${token.address}`}
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
            ${token.symbol}
          </p>
          <div className="text-sm text-green-500/60 mb-4">
            {token.marketType === 'bonding_curve' && (
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="truncate">{token.priceLevels[token.currentLevel - 1]?.name}</span>
                <span className="text-green-500/40 flex-shrink-0">→</span>
                <span className="text-green-500/40 truncate">
                  {token.priceLevels[token.currentLevel]?.name || 'FINAL FORM'}
                </span>
                <span className="text-green-500/40 ml-2 flex-shrink-0">
                  ({token.currentLevel}/{token.priceLevels?.length})
                </span>
              </div>
            )}
          </div>
          {token && (
            <>
              <div className="mt-4">
                <p className="text-xs text-green-500/40 mb-1">Market Cap</p>
                <p className="text-sm font-mono truncate">
                  ${marketCap}
                </p>
              </div>
              <>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-green-500/40 mb-1">
                      <span className="truncate">Progress to {stateInfo.next}</span>
                      <span className="flex-shrink-0">{Math.round(getProgress(token))}%</span>
                    </div>
                    <div className="h-1.5 bg-green-500/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${getProgress(token)}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 py-1 px-2 bg-green-500/10 rounded text-xs inline-flex items-center space-x-2 max-w-full">
                    <span className="truncate">{stateInfo.current}</span>
                    <span className="text-green-500/40 flex-shrink-0">→</span>
                    <span className="text-green-500/40 truncate">{stateInfo.next}</span>
                  </div>
                </>
            </>
          )}
        </div>
      </div>
    </Link>
  );
} 