import { useState, useEffect } from 'react';
import { getTokenStates } from '../onchain/tokenState';
import { getEthPrice } from '../api/price';
import { getLatestTokens } from '../api/tokens';
import Link from 'next/link';
import { formatEther } from 'viem';

// Featured token
const FEATURED_TOKEN = "0x17e1f08f8f80a07406d4f05420512ab5f2d7f56e".toLowerCase();

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

// Token Card Component
const TokenCard = ({ address, token, ethPrice }) => {
  if (!token) return null;

  const usdPrice = parseFloat(token.currentPrice) * ethPrice;
  const marketCap = usdPrice * parseFloat(token.totalSupply);
  
  // Fix progress calculation - use 800,000,000 instead of 800,000
  const bondingProgress = token.marketType === 0 ? 
    (parseFloat(token.totalSupply) / 800_000_000) * 100 : 100;

  return (
    <Link 
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

        {/* Always show progress bar for bonding curve tokens */}
        {token.marketType === 0 && (
          <div className="mt-4">
            <div className="h-2 bg-green-500/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500"
                style={{ width: `${Math.min(bondingProgress, 100)}%` }}
              />
            </div>
            <div className="text-xs text-green-500/50 mt-1 text-right">
              {bondingProgress.toFixed(1)}% to Uniswap
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default function GalleryPage() {
  const [featuredToken, setFeaturedToken] = useState(null);
  const [latestTokens, setLatestTokens] = useState([]);
  const [tokenStates, setTokenStates] = useState({});
  const [ethPrice, setEthPrice] = useState(0);
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(true);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [error, setError] = useState(null);

  // Separate effect for featured token and ETH price
  useEffect(() => {
    const fetchFeaturedToken = async () => {
      try {
        const [priceData, featuredState] = await Promise.all([
          getEthPrice(),
          getTokenStates([FEATURED_TOKEN])
        ]);
        
        setEthPrice(priceData.price_usd);
        setFeaturedToken(featuredState[FEATURED_TOKEN]);
      } catch (error) {
        console.error('Failed to fetch featured token:', error);
        setError(error.message);
      } finally {
        setIsLoadingFeatured(false);
      }
    };

    fetchFeaturedToken();
  }, []);

  // Separate effect for latest tokens
  useEffect(() => {
    const fetchLatestTokens = async () => {
      try {
        setLoadingLatest(true);
        const tokens = await getLatestTokens(25);
        console.log('Fetched latest tokens:', tokens);
        setLatestTokens(tokens);

        // Fetch states in batches
        const batchSize = 5;
        for (let i = 0; i < tokens.length; i += batchSize) {
          const batch = tokens.slice(i, i + batchSize);
          const batchAddresses = batch.map(t => t.address.toLowerCase());
          console.log('Fetching batch:', batchAddresses);
          const states = await getTokenStates(batchAddresses);
          
          setTokenStates(prev => ({
            ...prev,
            ...states
          }));
        }
      } catch (error) {
        console.error('Failed to fetch latest tokens:', error);
      } finally {
        setLoadingLatest(false);
      }
    };

    fetchLatestTokens();
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Featured Token */}
        <div className="mb-12">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">Featured Token</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingFeatured ? (
              <div className="animate-pulse border border-green-500/30 rounded-lg p-4 h-48">
                <div className="h-6 bg-green-500/20 rounded w-1/3 mb-4" />
                <div className="h-4 bg-green-500/20 rounded w-1/4 mb-6" />
                <div className="space-y-2">
                  <div className="h-4 bg-green-500/20 rounded w-full" />
                  <div className="h-4 bg-green-500/20 rounded w-2/3" />
                </div>
              </div>
            ) : featuredToken ? (
              <TokenCard 
                address={FEATURED_TOKEN} 
                token={featuredToken} 
                ethPrice={ethPrice}
              />
            ) : (
              <div className="text-red-500 border border-red-500/30 rounded-lg p-4">
                Failed to load featured token
              </div>
            )}
          </div>
        </div>

        {/* Latest Tokens */}
        <div>
          <h2 className="text-xl md:text-2xl font-bold mb-6">Latest Tokens</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {latestTokens.map((token) => (
              <TokenCard
                key={token.address}
                address={token.address}
                token={tokenStates[token.address.toLowerCase()]}
                ethPrice={ethPrice}
              />
            ))}
            {loadingLatest && (
              [...Array(6)].map((_, i) => (
                <div 
                  key={`skeleton-${i}`}
                  className="animate-pulse border border-green-500/30 rounded-lg p-4 h-48"
                >
                  <div className="h-6 bg-green-500/20 rounded w-1/3 mb-4" />
                  <div className="h-4 bg-green-500/20 rounded w-1/4 mb-6" />
                  <div className="space-y-2">
                    <div className="h-4 bg-green-500/20 rounded w-full" />
                    <div className="h-4 bg-green-500/20 rounded w-2/3" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}