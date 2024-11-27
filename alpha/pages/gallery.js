import { useState, useEffect } from 'react';
import { getTokenStates } from '../onchain/tokenState';
import { getEthPrice } from '../api/price';
import Link from 'next/link';
import { formatEther } from 'viem';

// List of featured token addresses
const FEATURED_TOKENS = [
  "0x17e1f08f8f80a07406d4f05420512ab5f2d7f56e",  // First token
  "0x48877d8084ce17674dd16c2f70a6eaeb0365ae63",  // Second token
  "0x6dd66ac50d12e6dfbb8bb49ee986e7172598587d",  // Third token
  "0x51edc66f0de12979ae8eaed9af743ef1902701fd",   // Fourth token
  "0xe12f487b6ce50788bffd49b9b60442b10df2b513",
  "0x3517cbff5b9cb9bd9e65dfe356db9c66dbac181e"
].map(addr => addr.toLowerCase());  // Normalize addresses

const formatUsdPrice = (price) => {
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
};

const formatMarketCap = (cap) => {
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(2)}B`;
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(2)}M`;
  if (cap >= 1_000) return `$${(cap / 1_000).toFixed(2)}K`;
  return `$${cap.toFixed(2)}`;
};

export default function GalleryPage() {
  const [tokenStates, setTokenStates] = useState({});
  const [ethPrice, setEthPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      setError(null);
      setIsRefreshing(true);

      // Use the price helper
      const priceData = await getEthPrice();
      setEthPrice(priceData.price_usd);

      // Fetch token states
      const states = await getTokenStates(FEATURED_TOKENS);
      console.log('Fetched token states:', states);
      setTokenStates(states);
    } catch (error) {
      console.error('Failed to fetch gallery data:', error);
      setError(error.message || 'Failed to load tokens');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up auto-refresh every 30 seconds
    const refreshInterval = setInterval(fetchData, 30000);
    return () => clearInterval(refreshInterval);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono">
        <div className="max-w-6xl mx-auto p-4 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Featured Tokens</h1>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-green-500/5 rounded-lg border border-green-500/20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Featured Tokens</h1>
          <button
            onClick={fetchData}
            disabled={isRefreshing}
            className={`px-4 py-2 border border-green-500 rounded text-sm hover:bg-green-500 hover:text-black transition-colors ${
              isRefreshing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-red-500/50 rounded bg-red-500/10 text-red-500">
            <p className="font-mono text-sm">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {FEATURED_TOKENS.map((address) => {
            const token = tokenStates[address];
            if (!token) return (
              <div key={address} className="border border-red-500/30 rounded-lg p-4">
                <p className="text-red-500 text-sm">Failed to load token {address}</p>
              </div>
            );

            const usdPrice = parseFloat(token.currentPrice) * ethPrice;
            const marketCap = usdPrice * parseFloat(token.totalSupply);
            const progress = token.marketType === 0 ? 
              (parseFloat(token.totalSupply) / 8000000) * 100 : 100;

            return (
              <Link 
                key={address}
                href={`/token/${address}`}
                className="block border border-green-500/30 rounded-lg p-4 hover:border-green-500 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold">{token.symbol}</h3>
                    <p className="text-green-500/70">{token.currentName}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-green-500/50">Price</div>
                    <div className="text-lg">${formatUsdPrice(usdPrice)}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500/70">Market Cap</span>
                    <span>{formatMarketCap(marketCap)}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-green-500/70">Supply</span>
                    <span>{((parseFloat(token.totalSupply) / 1_000_000_000) * 100).toFixed(2)}%</span>
                  </div>

                  {token.marketType === 0 && progress < 100 && (
                    <div className="mt-4">
                      <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 transition-all duration-500"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-green-500/50 mt-1 text-right">
                        {progress.toFixed(1)}% to Uniswap
                      </div>
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm text-green-500/50">
          Auto-refreshes every 30 seconds
        </div>
      </div>
    </div>
  );
}