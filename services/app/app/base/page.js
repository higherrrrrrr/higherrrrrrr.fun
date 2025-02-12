'use client';

import { useState, useEffect } from 'react';
import { useTokenData } from '../../hooks/useTokenData';
import TokenCard from '../../components/TokenCard';
import { FEATURED_TOKEN_ADDRESSES } from '../../constants/tokens';
import { SnakeBorder } from '../../components/SnakeBorder.js';

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingFeed
                ? [...Array(6)].map((_, i) => (
                    <div key={i} className="snake-border p-4 bg-black/20 rounded">
                      <div className="snake-line"></div>
                      <TokenCard isLoading />
                    </div>
                  ))
                : displayedTokens.map((token) => (
                    <TokenDataWrapper 
                      key={token.address} 
                      token={token}
                    />
                  ))}
            </div>
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
    <div className="snake-border p-4 bg-black/20 rounded">
      <div className="snake-line"></div>
      <TokenCard
        token={token}
        tokenState={tokenStateWithProgress}
        isLoading={loading}
      />
    </div>
  );
} 