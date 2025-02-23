'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '../../hooks/useWallet';
import { GlowBorder } from '../GlowBorder';
import { SwipeCards } from './SwipeCards';
import { TokenCard } from './TokenCard';

export function PortfolioSwipe() {
  const { publicKey, toBase58 } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!publicKey) return;

    const fetchPortfolio = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/portfolio?wallet=${toBase58()}`);
        if (!response.ok) throw new Error('Failed to fetch portfolio');
        const data = await response.json();
        setTokens(data.tokens);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [publicKey, toBase58]);

  if (!publicKey) return null;
  if (loading) return <div className="animate-pulse">Loading portfolio...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  const handleMilestone = (type, token) => {
    if (window.navigator.vibrate) {
      window.navigator.vibrate(200);
    }
  };

  const handleSwipe = (token, direction) => {
    console.log(`Swiped ${direction} on ${token.symbol}`);
  };

  return (
    <GlowBorder className="p-4">
      <h2 className="text-xl mb-4">Portfolio</h2>
      <div className="h-[400px] mb-4">
        <SwipeCards
          items={tokens}
          onSwipe={handleSwipe}
          renderItem={(token) => (
            <TokenCard 
              token={token} 
              onMilestone={handleMilestone}
            />
          )}
        />
      </div>
    </GlowBorder>
  );
} 