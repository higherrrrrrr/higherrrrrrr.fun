import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getTokenState, getProgressToNextLevel, getUniswapQuote } from '../../onchain';
import { useContractWrite, useWaitForTransaction, useContractRead, useAccount } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';
import { parseEther, formatEther } from 'viem';
import { higherrrrrrrAbi } from '../../onchain/generated';
import { getEthPrice } from '../../api/price';
import { getLatestTokens } from '../../api/contract';
import Link from 'next/link';

const MAX_SUPPLY = 1_000_000_000; // 1B tokens

export default function TokenPage() {
  const router = useRouter();
  const { address } = router.query;
  const [tokenState, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ethPrice, setEthPrice] = useState(0);
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [latestTokens, setLatestTokens] = useState([]);

  // Get the user's address
  const { address: userAddress } = useAccount();

  // Buy contract interaction
  const { write: buyToken, data: buyData } = useContractWrite({
    address: address,
    abi: higherrrrrrrAbi,
    functionName: 'buy'
  });

  // Sell contract interaction
  const { write: sellToken, data: sellData } = useContractWrite({
    address: address,
    abi: higherrrrrrrAbi,
    functionName: 'sell'
  });

  // Handle transaction states
  const { isLoading: isBuyLoading } = useWaitForTransaction({
    hash: buyData?.hash,
    onSuccess: () => refreshTokenState()
  });

  const { isLoading: isSellLoading } = useWaitForTransaction({
    hash: sellData?.hash,
    onSuccess: () => refreshTokenState()
  });

  const isLoading = isBuyLoading || isSellLoading;

  async function refreshTokenState() {
    if (typeof address === 'string') {
      const state = await getTokenState(address);
      setTokenState(state);
    }
  }

  // Add periodic refresh of token state
  useEffect(() => {
    if (address) {
      // Initial load
      setLoading(true);
      Promise.all([
        refreshTokenState(),
        getEthPrice()
      ])
        .then(([_, priceData]) => {
          setEthPrice(priceData.price_usd);
        })
        .catch(console.error)
        .finally(() => setLoading(false));

      // Set up periodic refresh of token state
      const tokenRefreshTimer = setInterval(() => {
        refreshTokenState().catch(console.error);
      }, 15000); // Every 15 seconds

      return () => clearInterval(tokenRefreshTimer);
    }
  }, [address]);

  // Refresh ETH price periodically
  useEffect(() => {
    const interval = setInterval(() => {
      getEthPrice()
        .then(priceData => {
          console.log('Updated ETH Price:', priceData.price_usd);
          setEthPrice(priceData.price_usd);
        })
        .catch(console.error);
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Update quote reads to handle errors and invalid states
  const { data: buyQuote, isError: buyQuoteError } = useContractRead({
    address: address ? `0x${address.replace('0x', '')}` : undefined,
    abi: higherrrrrrrAbi,
    functionName: 'getTokenBuyQuote',
    args: [parseEther(
      amount && 
      !isNaN(amount) && 
      isFinite(parseFloat(amount)) ? 
      amount : 
      '0'
    )],
    enabled: Boolean(amount && isBuying && address && tokenState?.marketType === 0), // Only for bonding curve
    watch: true,
  });

  const { data: sellQuote, isError: sellQuoteError } = useContractRead({
    address: address ? `0x${address.replace('0x', '')}` : undefined,
    abi: higherrrrrrrAbi,
    functionName: 'getTokenSellQuote',
    args: [parseEther(
      amount && 
      !isNaN(amount) && 
      isFinite(parseFloat(amount)) ? 
      amount : 
      '0'
    )],
    enabled: Boolean(amount && !isBuying && address && tokenState?.marketType === 0), // Only for bonding curve
    watch: true,
  });

  const handleAmountChange = (value) => {
    // Allow empty input
    if (value === '') {
      setAmount('');
      return;
    }

    // Parse the input value
    const numValue = value.replace(/,/g, ''); // Remove commas
    if (isNaN(numValue) || !isFinite(parseFloat(numValue))) {
      return;
    }

    setAmount(numValue);
  };

  // Define MIN_ETH_AMOUNT as a string instead of bigint
  const MIN_ETH_AMOUNT = "0.0000001";

  // Add error state
  const [error, setError] = useState("");

  // Update handleTransaction
  const handleTransaction = () => {
    if (!userAddress) return;
    setError(""); // Clear previous errors

    const marketType = tokenState?.marketType || 0;

    if (isBuying) {
      const quote = currentQuote;
      if (!quote || quoteError) return;
      
      // Check minimum amount for buying
      if (parseFloat(formatEther(quote)) < parseFloat(MIN_ETH_AMOUNT)) {
        setError(`Minimum trade amount is ${MIN_ETH_AMOUNT} ETH`);
        return;
      }
      
      buyToken({
        value: quote,
        args: [
          userAddress,
          userAddress,
          "",
          marketType,
          parseEther(MIN_ETH_AMOUNT),
          0
        ]
      });
    } else {
      if (!amount || quoteError) return;
      
      // Check minimum amount for selling
      const quote = currentQuote;
      if (parseFloat(formatEther(quote)) < parseFloat(MIN_ETH_AMOUNT)) {
        setError(`Minimum trade amount is ${MIN_ETH_AMOUNT} ETH`);
        return;
      }
      
      sellToken({
        args: [
          parseEther(amount),
          userAddress,
          "",
          marketType,
          parseEther(MIN_ETH_AMOUNT),
          0
        ]
      });
    }
  };

  // Add state for Uniswap quotes
  const [uniswapBuyQuote, setUniswapBuyQuote] = useState(null);
  const [uniswapSellQuote, setUniswapSellQuote] = useState(null);
  const [quoteError, setQuoteError] = useState(null);

  // Add loading state for quotes
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  // Add more detailed quote debugging
  useEffect(() => {
    if (!amount || !tokenState || !address) {
      console.log('Quote Debug: Missing data', { 
        hasAmount: Boolean(amount), 
        amountValue: amount,
        hasTokenState: Boolean(tokenState),
        marketType: tokenState?.marketType,
        hasAddress: Boolean(address),
        addressValue: address
      });
      return;
    }

    // Only update quotes for valid amounts
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      console.log('Quote Debug: Invalid amount', { amount });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        console.log('Quote Debug: Fetching quote', {
          marketType: tokenState.marketType,
          isBuying,
          amount,
          poolAddress: tokenState.poolAddress
        });
        
        setQuoteError(null);
        setIsQuoteLoading(true);

        if (tokenState.marketType === 1) {
          if (parseFloat(amount) < 1e9) {
            const tokenAmount = parseEther(amount);
            
            const quote = await getUniswapQuote(
              address,
              tokenState.poolAddress,
              tokenAmount,
              isBuying
            );
            
            console.log('Quote Debug: Received quote', {
              quote: formatEther(quote),
              isBuying
            });

            if (isBuying) {
              setUniswapBuyQuote(quote);
            } else {
              setUniswapSellQuote(quote);
            }
          } else {
            setQuoteError('Amount too large');
          }
        }
      } catch (error) {
        console.error('Quote Debug: Error', error);
        setQuoteError(error.message || 'Failed to get quote');
      } finally {
        setIsQuoteLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [amount, tokenState, address, isBuying]);

  // Use appropriate quote based on market type
  const currentQuote = useMemo(() => {
    if (!tokenState || !amount) return null;
    
    try {
      if (tokenState.marketType === 0) {
        // Bonding curve market
        return isBuying ? buyQuote : sellQuote;
      } else {
        // Uniswap market
        return isBuying ? uniswapBuyQuote : uniswapSellQuote;
      }
    } catch (error) {
      console.error('Quote calculation error:', error);
      return null;
    }
  }, [tokenState, amount, isBuying, buyQuote, sellQuote, uniswapBuyQuote, uniswapSellQuote]);

  // Update error display
  const quoteErrorState = useMemo(() => {
    if (!tokenState) return false;
    if (tokenState.marketType === 0) {
      return isBuying ? buyQuoteError : sellQuoteError;
    } else {
      return quoteError;
    }
  }, [tokenState, isBuying, buyQuoteError, sellQuoteError, quoteError]);

  // Add debug logging to isQuoteAvailable
  const isQuoteAvailable = useMemo(() => {
    if (!tokenState || !amount) {
      console.log('Quote Debug: No token state or amount', { tokenState, amount });
      return false;
    }
    
    console.log('Quote Debug: State', {
      marketType: tokenState.marketType,
      isBuying,
      buyQuote,
      sellQuote,
      uniswapBuyQuote,
      uniswapSellQuote,
      buyQuoteError,
      sellQuoteError,
      quoteError
    });
    
    if (tokenState.marketType === 0) {
      // Bonding curve market
      const isAvailable = isBuying ? 
        (buyQuote !== null && !buyQuoteError) : 
        (sellQuote !== null && !sellQuoteError);
      
      console.log('Quote Debug: Bonding curve quote available:', isAvailable, {
        buyQuote,
        sellQuote,
        buyQuoteError,
        sellQuoteError
      });
      
      return isAvailable;
    } else {
      // Uniswap market
      const isAvailable = isBuying ? 
        (uniswapBuyQuote !== null && !quoteError) : 
        (uniswapSellQuote !== null && !quoteError);
      
      console.log('Quote Debug: Uniswap quote available:', isAvailable, {
        uniswapBuyQuote,
        uniswapSellQuote,
        quoteError
      });
      
      return isAvailable;
    }
  }, [tokenState, amount, isBuying, buyQuote, sellQuote, uniswapBuyQuote, uniswapSellQuote, buyQuoteError, sellQuoteError, quoteError]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="text-green-500 font-mono">Loading...</div>
      </div>
    );
  }

  if (!tokenState) {
    return <div className="text-red-500 font-mono">Token not found</div>;
  }

  // Helper function to format USD price with appropriate decimals
  const formatUsdPrice = (price) => {
    if (price < 0.000001) return price.toExponential(2);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    return price.toFixed(2);
  };

  // Helper function to format market cap
  const formatMarketCap = (cap) => {
    if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(2)}B`;
    if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(2)}M`;
    if (cap >= 1_000) return `$${(cap / 1_000).toFixed(2)}K`;
    return `$${cap.toFixed(2)}`;
  };

  // Calculate values
  const priceInEth = parseFloat(tokenState.currentPrice);
  const usdPrice = priceInEth * ethPrice;
  const totalSupply = parseFloat(tokenState.totalSupply);
  const marketCapUsd = usdPrice * totalSupply;

  // Helper function to get current level index
  const getCurrentLevelIndex = (tokenState) => {
    if (!tokenState?.priceLevels || !tokenState?.currentName) return 0;
    return tokenState.priceLevels.findIndex(level => level.name === tokenState.currentName);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Ticker Bar */}
      <div className="border-b border-green-500/30 p-3 md:p-4">
        <div className="max-w-4xl mx-auto">
          {/* Mobile Layout */}
          <div className="md:hidden space-y-3">
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold">{tokenState.symbol}</div>
              <div className="text-lg">${formatUsdPrice(usdPrice)}</div>
            </div>
            <div className="flex justify-between text-sm">
              <div>
                <div className="text-green-500/50">Market Cap</div>
                <div>{formatMarketCap(marketCapUsd)}</div>
              </div>
              <div className="text-right">
                <div className="text-green-500/50">Supply</div>
                <div>{((totalSupply / 1_000_000_000) * 100).toFixed(2)}%</div>
              </div>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="text-2xl font-bold">{tokenState.symbol}</div>
            <div className="flex space-x-8">
              <div>
                <div className="text-sm text-green-500/50">Price</div>
                <div className="text-lg">${formatUsdPrice(usdPrice)}</div>
              </div>
              <div>
                <div className="text-sm text-green-500/50">Market Cap</div>
                <div className="text-lg">{formatMarketCap(marketCapUsd)}</div>
              </div>
              <div>
                <div className="text-sm text-green-500/50">Supply</div>
                <div className="flex flex-col">
                  <span>{totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0})}</span>
                  <span className="text-sm text-green-500/70">{((totalSupply / 1_000_000_000) * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-3 md:p-8 space-y-6 md:space-y-12">
        {/* Current Level */}
        <div className="text-center py-6 md:py-12">
          <div className="text-sm text-green-500/50 mb-2 md:mb-4">Current Name</div>
          <div className="text-4xl md:text-7xl font-bold mb-3 md:mb-6">
            {tokenState.currentName || 'Loading...'}
          </div>
          <div className="text-lg md:text-xl text-green-500/70">
            Level {getCurrentLevelIndex(tokenState) + 1} of {tokenState.priceLevels?.length || 0}
          </div>
        </div>

        {/* Progress Bar */}
        {tokenState.marketType === 0 && parseFloat(tokenState.totalSupply) < 800_000_000 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bonding Curve Progress</span>
              <span>{(parseFloat(tokenState.totalSupply) / 8000000).toFixed(2)}%</span>
            </div>
            <div className="w-full bg-green-500/20 rounded-full h-3 md:h-4">
              <div 
                className="bg-green-500 h-full rounded-full transition-all"
                style={{ width: `${(parseFloat(tokenState.totalSupply) / 8000000)}%` }}
              />
            </div>
          </div>
        )}

        {/* Trading Interface */}
        <div className="border border-green-500/30 rounded-lg p-4 md:p-6 space-y-4 md:space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold">Trade Token</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsBuying(true)}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-sm md:text-base rounded ${
                  isBuying 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setIsBuying(false)}
                className={`flex-1 md:flex-none px-3 md:px-4 py-2 text-sm md:text-base rounded ${
                  !isBuying 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Trading Form */}
          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="text-sm text-green-500/70 mb-2">Amount in Tokens</label>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none text-sm md:text-base"
                placeholder="Enter amount of tokens..."
              />
            </div>

            <div className="flex justify-between text-sm">
              <span>Current Price</span>
              <span className="text-right">{tokenState.currentPrice} ETH<br />
                <span className="text-green-500/70 text-xs">
                  (${(parseFloat(tokenState.currentPrice) * ethPrice).toFixed(2)})
                </span>
              </span>
            </div>

            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Quote Display */}
            {amount && (
              <div className="space-y-2 p-3 md:p-4 bg-green-500/5 rounded-lg text-sm">
                <div className="flex justify-between text-sm">
                  <span>{isBuying ? "You'll Pay" : "You'll Receive"}</span>
                  <span>
                    {isQuoteLoading ? 'Loading...' :
                     !isQuoteAvailable ? 'Quote unavailable' : 
                     currentQuote ? `${formatEther(currentQuote)} ETH` : '...'}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-green-500/70">
                  <span>USD Value</span>
                  <span>
                    {!isQuoteAvailable ? '-' :
                     currentQuote ? `$${(parseFloat(formatEther(currentQuote)) * ethPrice).toFixed(2)}` : '...'}
                  </span>
                </div>
                <div className="text-xs text-green-500/50 mt-2">
                  Minimum trade amount: {MIN_ETH_AMOUNT} ETH
                </div>
              </div>
            )}

            <button
              onClick={handleTransaction}
              disabled={
                tokenState.paused || 
                isLoading || 
                !amount || 
                !isQuoteAvailable ||
                (currentQuote && parseFloat(formatEther(currentQuote)) < parseFloat(MIN_ETH_AMOUNT))
              }
              className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded transition-colors text-sm md:text-base"
            >
              {isLoading 
                ? (isBuying ? "Buying..." : "Selling...") 
                : (isBuying 
                    ? `Buy ${Number(amount).toLocaleString()} Tokens` 
                    : `Sell ${Number(amount).toLocaleString()} Tokens`
                  )
              }
            </button>
          </div>
        </div>

        {/* Levels Table - Mobile Version */}
        <div className="md:hidden space-y-3">
          <h3 className="text-lg font-bold">Price Levels</h3>
          {tokenState.priceLevels.map((level, index) => {
            const levelUsdPrice = parseFloat(level.price) * ethPrice;
            const levelMarketCap = levelUsdPrice * MAX_SUPPLY;
            const isCurrentLevel = level.name === tokenState.currentName;
            const currentLevelIndex = tokenState.priceLevels.findIndex(l => l.name === tokenState.currentName);
            const isAchieved = index <= currentLevelIndex;

            return (
              <div 
                key={index}
                className={`p-3 rounded border border-green-500/30 ${
                  isCurrentLevel ? 'bg-green-500/10' : ''
                }`}
              >
                <div className="flex justify-between mb-1">
                  <span className="font-bold">{level.name}</span>
                  <span className="text-sm">Level {index + 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>${formatUsdPrice(levelUsdPrice)}</span>
                  <span className={
                    isCurrentLevel ? "text-green-500" :
                    isAchieved ? "text-green-500/50" :
                    "text-green-500/30"
                  }>
                    {isCurrentLevel ? "Current" :
                     isAchieved ? "Achieved" :
                     "Locked"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Levels Table - Desktop Version */}
        <div className="hidden md:block border border-green-500/30 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-500/30">
                <th className="p-4 text-left">Level</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-right">Price</th>
                <th className="p-4 text-right">Market Cap</th>
                <th className="p-4 text-center">State</th>
              </tr>
            </thead>
            <tbody>
              {tokenState.priceLevels.map((level, index) => {
                const levelUsdPrice = parseFloat(level.price) * ethPrice;
                const levelMarketCap = levelUsdPrice * MAX_SUPPLY;
                const isCurrentLevel = level.name === tokenState.currentName;
                
                // Find if this level is achieved (any level before current)
                const currentLevelIndex = tokenState.priceLevels.findIndex(l => l.name === tokenState.currentName);
                const isAchieved = index <= currentLevelIndex;

                return (
                  <tr 
                    key={index}
                    className={`
                      border-b border-green-500/10 
                      ${isCurrentLevel ? 'bg-green-500/10' : ''}
                    `}
                  >
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">{level.name}</td>
                    <td className="p-4 text-right">
                      ${formatUsdPrice(levelUsdPrice)}
                    </td>
                    <td className="p-4 text-right">
                      {formatMarketCap(levelMarketCap)}
                    </td>
                    <td className="p-4 text-center">
                      {isCurrentLevel ? (
                        <span className="text-green-500">Current</span>
                      ) : isAchieved ? (
                        <span className="text-green-500/50">Achieved</span>
                      ) : (
                        <span className="text-green-500/30">Locked</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 