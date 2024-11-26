import { useState, useEffect } from 'react';
import { useWallet } from '../hooks/useWallet';
import { getHighlightedToken } from '../api/tokens';
import { getLatestTokens } from '../api/contract';
import { getTokenState, getProgressToNextLevel } from '../onchain/tokenState';
import Link from 'next/link';

export default function TokensList() {
  const { address } = useWallet();
  const [highlightedToken, setHighlightedToken] = useState(null);
  const [latestTokens, setLatestTokens] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Fetching token data...');
        
        // First get the highlighted token address
        const highlighted = await getHighlightedToken();
        console.log('Raw highlighted token response:', highlighted);
        
        if (highlighted && highlighted.address) {
          try {
            // Then fetch its state
            const highlightedState = await getTokenState(highlighted.address);
            console.log('Highlighted token state:', highlightedState);
            
            // Combine the data
            const combinedHighlightedToken = {
              ...highlighted,
              ...highlightedState,
              address: highlighted.address
            };
            console.log('Combined highlighted token:', combinedHighlightedToken);
            setHighlightedToken(combinedHighlightedToken);
          } catch (stateError) {
            console.error('Failed to fetch highlighted token state:', stateError);
          }
        } else {
          console.log('No highlighted token found');
        }

        // Get latest tokens
        const latest = await getLatestTokens(100);
        console.log('Latest tokens:', latest);
        setLatestTokens(latest.tokens || []);
        
      } catch (error) {
        console.error('Failed to fetch tokens:', error);
        console.error('Error details:', {
          message: error.message,
          stack: error.stack
        });
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

  const recentDeployments = latestTokens.slice(0, 5);
  const allTokens = latestTokens.slice(5);

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

      {recentDeployments.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-mono text-green-500 border-b border-green-500/20 pb-2">
            Recent Deployments
          </h2>
          <div className="space-y-4">
            {recentDeployments.map((token) => (
              <Link 
                key={token.address} 
                href={`/token/${token.address}`}
                className="block border border-green-500/30 rounded-lg p-4 hover:border-green-500/60 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-mono text-green-500">{token.address}</div>
                    <div className="text-sm text-green-500/70 font-mono">
                      {new Date(token.timestamp * 1000).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-green-500/50 font-mono">
                    Block #{token.block_number}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h2 className="text-2xl font-mono text-green-500 border-b border-green-500/20 pb-2">
          Recent Launches
        </h2>
        <div className="space-y-4">
          {allTokens.map((token) => (
            <TokenCard 
              key={token.address} 
              token={token} 
              featured={false} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TokenCard({ token, featured }) {
  if (!token) return null;
  
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

  // Get the next price level
  const currentPriceIndex = token.priceLevels?.findIndex(
    level => level.name === token.currentName
  );
  const nextPriceLevel = token.priceLevels?.[currentPriceIndex + 1];

  // Calculate values based on available data
  const price = parseFloat(token.currentPrice || token.price || 0);
  const supply = parseFloat(token.totalSupply || 0);
  const marketCap = price * supply;

  // Get current stage name
  const currentStage = token.currentName || token.name || 'Unknown Token';
  
  // Only show progress for bonding curve tokens
  const progress = token.marketType === 0 ? getProgressToNextLevel(token) : 0;

  return (
    <Link 
      href={`/token/${token.address}`}
      className={`block border rounded-lg p-6 transition-colors ${
        featured 
          ? "border-green-500 bg-green-500/5 hover:bg-green-500/10" 
          : "border-green-500/50 hover:border-green-500"
      }`}
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
          <p className="text-green-500 font-mono">
            ${formatPrice(price)}
          </p>
          <p className="text-green-500/70 text-sm font-mono">
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
            <span className="text-green-500">
              ${formatPrice(nextPriceLevel.price)}
            </span>
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
              {Math.min(progress, 100).toFixed(1)}% to next stage
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}