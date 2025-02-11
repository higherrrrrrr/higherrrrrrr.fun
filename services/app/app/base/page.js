'use client';

import { useState, useEffect } from 'react';
import { getTokenState } from '../../onchain/tokenState';
import TokenCard from '../../components/TokenCard';
import { FEATURED_TOKEN_ADDRESSES } from '../../constants/tokens';

// Constants
const TOKENS_PER_PAGE = 24;

export default function BaseTokens() {
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [tokenStates, setTokenStates] = useState({});

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

  // Fetch token states
  useEffect(() => {
    const fetchTokenStates = async () => {
      if (!displayedTokens.length) return;

      try {
        const statePromises = displayedTokens.map(async (token) => {
          try {
            const state = await getTokenState(token.address);
            return {
              address: token.address,
              state: state ? {
                ...state,
                progress: state.marketType === 'bonding_curve'
                  ? (state.currentPrice / state.priceLevels[state.priceLevels.length - 1]) * 100
                  : null
              } : null
            };
          } catch (err) {
            console.error(`Error fetching state for ${token.address}:`, err);
            return { address: token.address, state: null };
          }
        });

        const results = await Promise.all(statePromises);
        const states = {};
        results.forEach((r) => {
          if (r.state) {
            states[r.address] = r.state;
          }
        });
        setTokenStates(states);
      } catch (err) {
        console.error('Error fetching token states:', err);
      }
    };
    
    fetchTokenStates();
  }, [displayedTokens]);

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
                    <div
                      key={token.address}
                      className="snake-border p-4 bg-black/20 rounded"
                    >
                      <div className="snake-line"></div>
                      <TokenCard
                        token={token}
                        tokenState={tokenStates[token.address]}
                        isLoading={!tokenStates[token.address]}
                      />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 