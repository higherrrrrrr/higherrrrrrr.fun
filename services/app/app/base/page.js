'use client';

import { useState, useEffect } from 'react';
import TokenCard from '../../components/TokenCard';
import { FEATURED_TOKEN_ADDRESSES } from '../../constants/tokens';
import { GlowBorder } from '../../components/GlowBorder.js';

function TokenDataWrapper({ token }) {
  const [tokenSymbol, setTokenSymbol] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTokenSymbol = async () => {
      try {
        const response = await fetch('https://mainnet.base.org', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{
              to: token.address,
              data: '0x95d89b41' // symbol() function signature
            }, 'latest'],
            id: 1
          })
        });
        const data = await response.json();
        if (data.result) {
          const symbol = Buffer.from(data.result.slice(2), 'hex')
            .toString('utf8')
            .replace(/\0/g, '');
          setTokenSymbol(symbol);
        }
      } catch (error) {
        console.error('Error fetching token symbol:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenSymbol();
  }, [token.address]);

  return (
    <GlowBorder className="p-4 bg-black/20">
      <TokenCard
        token={{
          ...token,
          symbol: tokenSymbol
        }}
        isLoading={loading}
      />
    </GlowBorder>
  );
}

export default function BaseTokens() {
  const [displayedTokens, setDisplayedTokens] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  useEffect(() => {
    const loadTokens = async () => {
      try {
        setIsLoadingFeed(true);
        const tokens = FEATURED_TOKEN_ADDRESSES.map(address => ({
          address,
          creation_time: "2024-01-01",
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

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingFeed && (
              [...Array(6)].map((_, i) => (
                <GlowBorder key={i} className="p-4 bg-black/20">
                  <TokenCard isLoading />
                </GlowBorder>
              ))
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