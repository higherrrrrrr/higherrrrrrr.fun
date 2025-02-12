import { GlowBorder } from './GlowBorder';
import Link from 'next/link';
import React from 'react';

export function SolanaTokenCard({ token, category }) {
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

  // Get volume-based emoji with higher thresholds
  const getVolumeEmoji = (volume) => {
    const vol = parseFloat(volume);
    if (!vol) return '';
    if (vol >= 1e7) return '🔥'; // Over 10M
    if (vol >= 5e6) return '⚡'; // Over 5M
    if (vol >= 1e6) return '💫'; // Over 1M
    if (vol >= 5e5) return '✨'; // Over 500K
    return '';
  };

  // Get category-based emoji
  const getCategoryEmoji = (category) => {
    switch (category?.toLowerCase()) {
      case 'meme': return '🎭';
      case 'major': return '💎';
      case 'vc': return '🏢';
      default: return '';
    }
  };

  // Now use the functions in useMemo
  const formattedValues = React.useMemo(() => ({
    volume: formatVolume(token.volume_24h),
    trades: formatNumber(token.trades_24h, 0),
    holders: formatNumber(token.total_accounts, 0),
    created: formatDate(token.created_at),
    volumeEmoji: getVolumeEmoji(token.volume_24h),
    categoryEmoji: getCategoryEmoji(category)
  }), [token.volume_24h, token.trades_24h, token.total_accounts, token.created_at, category, formatNumber]);

  return (
    <div className="relative">
      <GlowBorder>
        <Link 
          href={`https://ape.pro/solana/${token.token_address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-4"
        >
          {token.hasDuplicates && !token.isOriginal && (
            <div className="absolute -top-2 -right-2 z-10 group">
              <span className="text-yellow-500 cursor-help">⚠️</span>
              <div className="invisible group-hover:visible absolute top-0 right-0 translate-x-2
                            p-2 bg-black/95 border border-green-500/30 rounded text-xs whitespace-nowrap z-10 min-w-[200px]">
                <div className="mb-1">
                  {token.duplicateCount} similar {token.duplicateCount === 1 ? 'token' : 'tokens'} found
                </div>
                <div className="text-green-500/70">
                  {token.legitimacyDetails}
                  <br />
                  Not financial advice. DYOR.
                </div>
              </div>
            </div>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-green-500 flex items-center">
                <span>{token.name || 'Unknown Token'}</span>
                <span className="ml-2">{formattedValues.categoryEmoji}</span>
              </h3>
              <p className="text-sm text-green-500/70">
                {token.symbol}
                {category && (
                  <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-500/10">
                    {category}
                  </span>
                )}
              </p>
            </div>

            <div className="text-right">
              <div className="font-mono font-bold text-green-400">
                {formattedValues.volume}
                <span className="ml-2">{formattedValues.volumeEmoji}</span>
              </div>
              <div className="text-xs text-green-500/50">
                24h Volume
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-green-500/50">Trades (24h)</div>
              <div className="font-mono text-green-400">
                {formattedValues.trades}
              </div>
            </div>
            <div>
              <div className="text-green-500/50">Holders</div>
              <div className="font-mono text-green-400">
                {formattedValues.holders}
              </div>
            </div>
            <div>
              <div className="text-green-500/50">Created</div>
              <div className="font-mono text-green-400">
                {formattedValues.created}
              </div>
            </div>
          </div>
        </Link>
      </GlowBorder>
    </div>
  );
} 