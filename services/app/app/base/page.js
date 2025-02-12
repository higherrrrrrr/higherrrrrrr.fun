'use client';

import { useState, useEffect } from 'react';
import { useTokenData } from '../../hooks/useTokenData';
import TokenCard from '../../components/TokenCard';
import { FEATURED_TOKEN_ADDRESSES } from '../../constants/tokens';
import { GlowBorder } from '../../components/GlowBorder.js';

export default function BaseTokens() {
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Load tokens
  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoadingFeed(true);
        
        // Create token objects from addresses
        const tokens = FEATURED_TOKEN_ADDRESSES.map(address => ({
          address,
          creation_time: "2024-01-01", // Default date if needed
        }));
        
        setDisplayedTokens(tokens);
      } catch (error) {
        console.error('Error loading tokens:', error);
        setDisplayedTokens([]);
      } finally {
        setIsLoadingFeed(false);
      }
    };
    
    loadTokens();
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="w-full pt-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Base Tokens</h1>
            <p className="text-green-500/60">Featured tokens on Base</p>
          </div>

          <div>
            {isLoadingFeed && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <GlowBorder key={i} className="p-4 bg-black/20">
                    <TokenCard isLoading />
                  </GlowBorder>
                ))}
              </div>
            )}
            {!isLoadingFeed && displayedTokens.map((token) => (
              <TokenDataWrapper 
                key={token.address} 
                token={token}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component to handle individual token data
function TokenDataWrapper({ token }) {
  const { tokenState, loading } = useTokenData(token.address);

  // Calculate progress if it's a bonding curve
  const tokenStateWithProgress = tokenState ? {
    ...tokenState,
    progress: tokenState.marketType === 'bonding_curve'
      ? (tokenState.currentPrice / tokenState.priceLevels[tokenState.priceLevels.length - 1]) * 100
      : null
  } : null;

  return (
    <GlowBorder className="p-4 bg-black/20">
      <TokenCard
        token={token}
        tokenState={tokenStateWithProgress}
        isLoading={loading}
      />
    </GlowBorder>
  );
} 