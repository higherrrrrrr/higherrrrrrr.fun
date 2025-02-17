'use client';
import { GlowBorder } from './GlowBorder';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useTokenInfo } from '../hooks/useTokenInfo';
import { formatNumber } from '../utils/format';
import { TradingModal } from './TradingModal';

export function SolanaTokenList({ tokens, category }) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Calculate pagination
  const indexOfLastToken = currentPage * itemsPerPage;
  const indexOfFirstToken = indexOfLastToken - itemsPerPage;
  const currentTokens = tokens.slice(indexOfFirstToken, indexOfLastToken);
  const totalPages = Math.ceil(tokens.length / itemsPerPage);

  return (
    <div>
      {/* Token grid */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {currentTokens.map((token) => (
          <SolanaTokenCard 
            key={token.token_address} 
            token={token} 
            category={category}
          />
        ))}
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center items-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-green-500/30 disabled:opacity-50 
                     disabled:cursor-not-allowed hover:bg-green-500/10 transition-colors"
          >
            Previous
          </button>
          
          <span className="text-green-500">
            Page {currentPage} of {totalPages}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 border border-green-500/30 disabled:opacity-50 
                     disabled:cursor-not-allowed hover:bg-green-500/10 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export function SolanaTokenCard({ token, category }) {
  const { data, loading, error } = useTokenInfo(token.token_address);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  // Define formatting functions first
  const formatVolume = (vol) => {
    if (!vol) return '$0';
    const num = parseFloat(vol);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatNumber = React.useCallback((num, decimals = 2) => {
    if (!num) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }, []);

  const formatPrice = (price) => {
    if (!price) return 'N/A';
    const num = parseFloat(price);
    if (num >= 1) return `$${formatNumber(num, 2)}`;
    if (num >= 0.01) return `$${formatNumber(num, 4)}`;
    return `$${formatNumber(num, 6)}`;
  };

  const formatMarketCap = (mc) => {
    if (!mc) return 'N/A';
    const num = parseFloat(mc);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${formatNumber(num, 2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 24 * 30) return `${Math.floor(diffHours/24)}d ago`;
    if (diffHours < 24 * 365) return `${Math.floor(diffHours/(24 * 30))}mo ago`;
    return `${Math.floor(diffHours/(24 * 365))}y ago`;
  };

  const getVolumeEmoji = (volume) => {
    const vol = parseFloat(volume);
    if (!vol) return '';
    if (vol >= 1e7) return '🔥'; // Over 10M
    if (vol >= 5e6) return '⚡'; // Over 5M
    if (vol >= 1e6) return '💫'; // Over 1M
    if (vol >= 5e5) return '✨'; // Over 500K
    return '';
  };

  const getCategoryEmoji = (category) => {
    switch (category?.toLowerCase()) {
      case 'meme': return '🎭';
      case 'major': return '💎';
      case 'vc': return '🏢';
      default: return '';
    }
  };

  const getLegitimacyScoreColor = (score) => {
    score = parseInt(score) || 0;
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formatPriceChange = (change) => {
    if (change === null || change === undefined) return null;
    const num = parseFloat(change);
    if (isNaN(num)) return null;
    const formatted = Math.abs(num).toFixed(2);
    const prefix = num > 0 ? '+' : '';
    return `${prefix}${formatted}%`;
  };

  const getPriceChangeColor = (change) => {
    if (change === null || change === undefined) return 'text-green-500/60';
    const num = parseFloat(change);
    if (isNaN(num)) return 'text-green-500/60';
    if (num > 0) return 'text-green-400';
    if (num < 0) return 'text-red-400';
    return 'text-green-500/60';
  };

  const getPriceChangeArrow = (change) => {
    if (change === null || change === undefined) return '';
    const num = parseFloat(change);
    if (isNaN(num)) return '';
    if (num > 0) return '↗';
    if (num < 0) return '↘';
    return '';
  };

  const formattedValues = React.useMemo(() => ({
    volume: formatVolume(token.volume_24h),
    trades: formatNumber(token.trades_24h, 0),
    holders: formatNumber(token.total_accounts, 0),
    created: formatDate(token.created_at),
    volumeEmoji: getVolumeEmoji(token.volume_24h),
    categoryEmoji: getCategoryEmoji(category),
    price: formatPrice(data?.price),
    marketCap: formatMarketCap(data?.marketCap),
    priceChange1h: formatPriceChange(data?.priceChanges?.['1h']),
    priceChange6h: formatPriceChange(data?.priceChanges?.['6h']),
    priceChange24h: formatPriceChange(data?.priceChanges?.['24h'])
  }), [token, category, data, formatNumber]);

  return (
    <div className="relative h-full">
      <GlowBorder className="h-full">
        <div className="p-4 h-full">
          {/* Header: Token Name + Category + 24h Change */}
          <div className="flex items-start justify-between mb-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-green-500 flex items-center truncate text-lg">
                <span className="truncate">{token.name || 'Unknown Token'}</span>
                <span className="ml-2 flex-shrink-0">{formattedValues.categoryEmoji}</span>
              </h3>
              <div className="text-sm text-green-500/70 flex items-center gap-2">
                <span className="font-mono">{token.symbol}</span>
                {category && (
                  <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 flex-shrink-0">
                    {category}
                  </span>
                )}
              </div>
            </div>
            
            {/* Price Change - Most prominent */}
            <div className="text-right">
              {!loading && !error && formattedValues.priceChange24h && (
                <div className={`font-mono text-lg font-bold ${getPriceChangeColor(data?.priceChanges?.['24h'])}`}>
                  {getPriceChangeArrow(data?.priceChanges?.['24h'])} {formattedValues.priceChange24h}
                </div>
              )}
              <div className="text-xs text-green-500/50">24h Change</div>
            </div>
          </div>

          {/* Key Trading Metrics */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-green-500/60">Current Price:</span>
              <span className="font-mono font-bold text-green-400 text-lg">
                {loading ? '...' : formattedValues.price}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-green-500/60">24h Volume:</span>
              <div className="font-mono font-bold text-green-400 flex items-center gap-2">
                {formattedValues.volume}
                <span>{formattedValues.volumeEmoji}</span>
              </div>
            </div>
          </div>

          {/* Trading Activity Grid */}
          <div className="grid grid-cols-3 gap-4 text-sm mb-4">
            <div>
              <div className="text-green-500/50">Trades (24h)</div>
              <div className="font-mono text-green-400 font-bold">
                {formattedValues.trades}
              </div>
            </div>
            <div>
              <div className="text-green-500/50">Holders</div>
              <div className="font-mono text-green-400 font-bold">
                {formattedValues.holders}
              </div>
            </div>
            <div>
              <div className="text-green-500/50">Market Cap</div>
              <div className="font-mono text-green-400 font-bold">
                {loading ? '...' : formattedValues.marketCap}
              </div>
            </div>
          </div>

          {/* Detailed Price Changes */}
          <div className="bg-black/20 rounded-lg p-3">
            <div className="text-xs text-green-500/60 mb-2">Price Changes</div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-green-500/40 text-[10px] mb-1">1H</div>
                <div className={`font-mono font-bold ${getPriceChangeColor(data?.priceChanges?.['1h'])}`}>
                  {loading ? '...' : formattedValues.priceChange1h || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-green-500/40 text-[10px] mb-1">6H</div>
                <div className={`font-mono font-bold ${getPriceChangeColor(data?.priceChanges?.['6h'])}`}>
                  {loading ? '...' : formattedValues.priceChange6h || 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-green-500/40 text-[10px] mb-1">24H</div>
                <div className={`font-mono font-bold ${getPriceChangeColor(data?.priceChanges?.['24h'])}`}>
                  {loading ? '...' : formattedValues.priceChange24h || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Trust Score - Now at the bottom as supplementary info */}
          {token.legitimacyScore && (
            <div className="mt-3 group relative inline-block">
              <span className="text-green-500/50 text-sm font-mono">
                Trust Score: <span className={`${getLegitimacyScoreColor(token.legitimacyScore)} cursor-help`}>
                  {token.legitimacyScore}%
                </span>
              </span>
              <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-72 bg-black/95 border border-green-500/30 rounded-lg text-sm text-green-500/90 z-10 shadow-xl backdrop-blur-sm">
                {token.legitimacyDetails && (
                  <div className="text-xs text-green-500/70">
                    {token.legitimacyDetails}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add Trade Button */}
          <div className="mt-4 flex justify-between items-center">
            <Link 
              href={`https://ape.pro/solana/${token.token_address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500/70 hover:text-green-500 text-sm"
            >
              View Details →
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsTradeModalOpen(true);
              }}
              className="px-4 py-2 bg-green-500 text-black rounded-lg hover:bg-green-400 transition-colors font-bold"
            >
              Trade
            </button>
          </div>
        </div>
      </GlowBorder>

      {/* Trading Modal */}
      <TradingModal
        token={{
          ...token,
          ...data,
          address: token.token_address,
        }}
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
      />
    </div>
  );
} 