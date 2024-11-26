import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getTokens, getHighlightedToken } from '../api/tokens';

export default function TokensList() {
  const { address } = useWallet();
  const [tokens, setTokens] = useState([]);
  const [highlightedToken, setHighlightedToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [highlighted, allTokens] = await Promise.all([
          getHighlightedToken(),
          getTokens()
        ]);
        setHighlightedToken(highlighted);
        setTokens(allTokens || []);
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="text-green-500 font-mono text-center animate-pulse">
        Loading tokens...
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {highlightedToken && (
        <div className="space-y-4">
          <h2 className="text-2xl font-mono text-green-500 border-b border-green-500/20 pb-2">
            Featured Token
          </h2>
          <TokenCard token={highlightedToken} featured={true} />
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-mono text-green-500 border-b border-green-500/20 pb-2">
          Active Tokens
        </h2>
        <div className="space-y-4">
          {/* {tokens && tokens.map((token) => (
            <TokenCard 
              key={token.address || token.id} 
              token={token} 
              featured={false} 
            />
          ))} */}
        </div>
      </div>
    </div>
  );
}

function TokenCard({ token, featured }) {
  if (!token) return null;

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return typeof num === 'number' ? num.toLocaleString() : '0';
  };

  const formatPrice = (num) => {
    if (!num && num !== 0) return '0.00000000';
    return typeof num === 'number' ? num.toFixed(8) : '0.00000000';
  };

  return (
    <div 
      className={`border rounded-lg p-6 transition-colors ${
        featured 
          ? "border-green-500 bg-green-500/5 hover:bg-green-500/10" 
          : "border-green-500/50 hover:border-green-500"
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-mono text-green-500">{token.name || 'Unknown Token'}</h3>
          <p className="text-green-500/70 font-mono">${token.symbol || '???'}</p>
        </div>
        <div className="text-right">
          <p className="text-green-500 font-mono">${formatPrice(token.price)}</p>
          <p className="text-green-500/70 text-sm font-mono">Stage {token.stage || 0}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm font-mono">
          <span className="text-green-500/70">Market Cap</span>
          <span className="text-green-500">${formatNumber(token.marketCap)}</span>
        </div>
        <div className="flex justify-between text-sm font-mono">
          <span className="text-green-500/70">Next Stage</span>
          <span className="text-green-500">${formatPrice(token.nextStagePrice)}</span>
        </div>
      </div>

      <div className="mt-6">
        <button 
          className={`w-full px-4 py-2 font-mono rounded transition-colors ${
            featured 
              ? "bg-green-500 hover:bg-green-400 text-black" 
              : "bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black"
          }`}
        >
          Trade
        </button>
      </div>
    </div>
  );
}