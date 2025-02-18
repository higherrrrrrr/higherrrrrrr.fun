import { GlowBorder } from './GlowBorder';
import Link from 'next/link';
import React, { useState, useCallback } from 'react';
import { Connection } from '@solana/web3.js';

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
    score = parseInt(score) || 0;  // Ensure we have a number
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-500';
    return 'text-red-500';
  };

  const formattedValues = React.useMemo(() => ({
    volume: formatVolume(token.volume_24h),
    trades: formatNumber(token.trades_24h, 0),
    holders: formatNumber(token.total_accounts, 0),
    created: formatDate(token.created_at),
    volumeEmoji: getVolumeEmoji(token.volume_24h),
    categoryEmoji: getCategoryEmoji(category)
  }), [token.volume_24h, token.trades_24h, token.total_accounts, token.created_at, category, formatNumber]);

  const handleClick = useCallback(async (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined' && window.Jupiter) {
      try {
        console.log('Opening Jupiter Terminal for token:', token.token_address);

        // Initialize Jupiter Terminal with the token as output (buying)
        window.Jupiter.init({
          endpoint: process.env.NEXT_PUBLIC_HELIUS_SECURE_RPC_URL,
          displayMode: "modal",
          defaultExplorer: "Solana Explorer",
          strictTokenList: false,
          formProps: {
            // Input token (what user pays with)
            initialInputMint: token.token_address, // The token they want to sell
            fixedInputMint: true, // Lock the input token

            // Output token (what user receives)
            initialOutputMint: "So11111111111111111111111111111111111111112", // SOL
            fixedOutputMint: false, // Allow changing output token

            swapMode: "ExactIn", // Set to exact input mode for selling
          }
        });

      } catch (error) {
        console.error('Failed to open Jupiter Terminal:', error);
      }
    }
  }, [token.token_address]);

  return (
    <div className="relative h-full">
      <GlowBorder className="h-full">
        <div 
          onClick={handleClick}
          className="block p-4 h-full cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-green-500 flex items-center truncate">
                <span className="truncate">{token.name || 'Unknown Token'}</span>
                <span className="ml-2 flex-shrink-0">{formattedValues.categoryEmoji}</span>
              </h3>
              <div className="text-sm text-green-500/70 flex items-center gap-2">
                <span className="truncate">{token.symbol}</span>
                {category && (
                  <span className="px-2 py-0.5 text-xs rounded bg-green-500/10 flex-shrink-0">
                    {category}
                  </span>
                )}
              </div>
              {token.legitimacyScore && (
                <div className="mt-1 group relative inline-block">
                  <span className="text-green-500/50 text-sm font-mono">
                    Trust Score: <span className={`${getLegitimacyScoreColor(token.legitimacyScore)} cursor-help`}>
                      {token.legitimacyScore}%
                    </span>
                  </span>
                  <div className="invisible group-hover:visible absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 p-3 w-72 bg-black/95 border border-green-500/30 rounded-lg text-sm text-green-500/90 z-10 shadow-xl backdrop-blur-sm">
                    {token.hasDuplicates && token.duplicateCount > 0 && (
                      <div className="text-yellow-500 text-xs mb-2">
                        ⚠️ {token.duplicateCount} similar {token.duplicateCount === 1 ? 'token was' : 'tokens were'} found
                      </div>
                    )}
                    {token.legitimacyDetails && (
                      <div className="text-xs text-green-500/70">
                        {token.legitimacyDetails}
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-green-500/20 text-xs text-yellow-500/70">
                      ⚠️ This score is an estimate and may be inaccurate.
                      <br />
                      Always do your own research (DYOR).
                      <br />
                      Not financial advice (NFA).
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black border-r border-b border-green-500/30"></div>
                  </div>
                </div>
              )}
            </div>

            <div className="text-right flex-shrink-0">
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
        </div>
      </GlowBorder>
    </div>
  );
} 