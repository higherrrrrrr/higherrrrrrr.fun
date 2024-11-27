import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getHighlightedToken } from '../api/tokens';
import { getLatestTokens } from '../api/contract';
import { getTokenState, getTokenStates } from '../onchain/tokenState';
import Link from 'next/link';

export default function TokensList() {
  const { address } = useWallet();
  const [highlightedToken, setHighlightedToken] = useState(null);
  const [latestTokens, setLatestTokens] = useState([]);
  const [tokenStates, setTokenStates] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Function to refresh token states in parallel batches
  const refreshTokenStates = async (tokens) => {
    try {
      const addresses = tokens.map(t => t.address);
      console.log('Fetching states for tokens:', addresses);
      const states = await getTokenStates(addresses);
      console.log('Received states:', states);
      setTokenStates(prev => ({
        ...prev,
        ...states
      }));
      return states; // Return states for immediate use
    } catch (error) {
      console.error('Failed to fetch token states:', error);
      return null;
    }
  };

  // Initial data load
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching token data...');
        
        // Fetch tokens and highlighted token in parallel
        const [highlighted, latest] = await Promise.all([
          getHighlightedToken(),
          getLatestTokens(25)
        ]);

        console.log('Highlighted token:', highlighted);
        
        setLatestTokens(latest.tokens || []);
        
        // Start loading states immediately
        const allTokens = [...(latest.tokens || [])];
        if (highlighted?.address) {
          allTokens.push(highlighted);
        }

        // Set loading false after we have the token list
        setIsLoading(false);

        // Load states and immediately use them
        const states = await refreshTokenStates(allTokens);
        
        // Set highlighted token with its state
        if (highlighted?.address && states) {
          const highlightedState = states[highlighted.address];
          console.log('Setting highlighted token with state:', {
            highlighted,
            state: highlightedState
          });
          setHighlightedToken({
            ...highlighted,
            ...highlightedState,
            address: highlighted.address
          });
        }
        
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
        setIsLoading(false);
      }
    };

    fetchData();

    // Set up periodic refresh
    const refreshTimer = setInterval(() => {
      const allTokens = [...latestTokens];
      if (highlightedToken) {
        allTokens.push(highlightedToken);
      }
      refreshTokenStates(allTokens).then(states => {
        // Update highlighted token with new state
        if (highlightedToken?.address && states) {
          const newHighlightedState = states[highlightedToken.address];
          setHighlightedToken(prev => ({
            ...prev,
            ...newHighlightedState
          }));
        }
      });
    }, 15000);

    return () => clearInterval(refreshTimer);
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

      {latestTokens.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-mono text-green-500 border-b border-green-500/20 pb-2">
            Recent Launches
          </h2>
          <div className="space-y-4">
            {latestTokens.map((token) => {
              return (
                <TokenCard 
                  key={token.address} 
                  token={{
                    ...token,
                    ...(tokenStates[token.address] || {}),
                    address: token.address
                  }}
                  featured={false} 
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TokenCard({ token, featured }) {
  if (!token) return null;
  
  const isLoading = !token.currentName && !token.name;
  
  if (isLoading) {
    return (
      <div className={`block border rounded-lg p-6 transition-colors ${
        featured 
          ? "border-green-500 bg-green-500/5" 
          : "border-green-500/50"
      }`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-green-500/20 rounded w-1/4"></div>
          <div className="h-8 bg-green-500/20 rounded w-1/2"></div>
          <div className="h-4 bg-green-500/20 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  console.log('Rendering TokenCard:', {
    token,
    featured,
    address: token.address,
    currentName: token.currentName,
    priceLevels: token.priceLevels,
    price: token.currentPrice || token.price,
    marketType: token.marketType
  });

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return typeof num === 'number' ? num.toLocaleString() : '0';
  };

  const formatPrice = (num) => {
    if (!num && num !== 0) return '0.00000000';
    const value = parseFloat(num);
    return isNaN(value) ? '0.00000000' : value.toFixed(8);
  };

  // Get the next price level and name
  const currentPriceIndex = token.priceLevels?.findIndex(
    level => level.name === token.currentName
  );
  const nextPriceLevel = token.priceLevels?.[currentPriceIndex + 1];
  const nextStageName = nextPriceLevel?.name;

  // Calculate values based on available data
  const price = parseFloat(token.currentPrice || token.price || 0);
  const supply = parseFloat(token.totalSupply || 0);
  const marketCap = price * supply;

  // Get current stage name
  const currentStage = token.currentName || token.name || 'Unknown Token';
  
  // Only show progress for bonding curve tokens
  const progress = token.marketType === 0 ? getProgressToNextLevel(token) : 0;

  return (
    <div className={`block border rounded-lg p-6 transition-colors ${
      featured 
        ? "border-green-500 bg-green-500/5 hover:bg-green-500/10" 
        : "border-green-500/50 hover:border-green-500"
    }`}>
      <Link 
        href={`/token/${token.address}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-mono text-green-500">
              {token.name || 'Unknown Token'}
            </h3>
            <p className="text-green-500/70 font-mono">
              ${token.symbol || '???'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-green-500/50 mb-1">Current Price</div>
            <p className="text-xl font-bold text-green-500 font-mono">
              ${formatPrice(price)}
            </p>
            <p className="text-green-500/70 text-sm font-mono mt-1">
              {currentStage}
            </p>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-mono">
            <span className="text-green-500/70">Market Cap</span>
            <span className="text-green-500">${formatNumber(marketCap)}</span>
          </div>
          {nextPriceLevel && (
            <div className="flex justify-between text-sm font-mono">
              <span className="text-green-500/70">Next Stage</span>
              <div className="text-right">
                <span className="text-green-500">
                  ${formatPrice(nextPriceLevel.price)}
                </span>
                <div className="text-xs text-green-500/50">
                  {nextStageName}
                </div>
              </div>
            </div>
          )}
          {token.marketType === 0 && progress > 0 && (
            <div className="mt-2">
              <div className="h-1 bg-green-500/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="text-xs text-green-500/50 mt-1 text-right font-mono">
                {Math.min(progress, 100).toFixed(1)}% to {nextStageName || 'next stage'}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Trade Button */}
      <div className="mt-4 pt-4 border-t border-green-500/20">
        <Link 
          href={`/token/${token.address}`}
          className="block w-full px-4 py-2 bg-green-500 hover:bg-green-400 text-black font-mono text-center rounded transition-colors"
        >
          Trade
        </Link>
      </div>
    </div>
  );
}