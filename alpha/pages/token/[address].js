import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getTokenState, getProgressToNextLevel, getUniswapQuote, getTokenBalance } from '../../onchain';
import { useContractWrite, useWaitForTransaction, useContractRead, useAccount, useBalance } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';
import { parseEther, formatEther } from 'viem';
import { higherrrrrrrAbi } from '../../onchain/generated';
import { getEthPrice } from '../../api/price';
import { getLatestTokens } from '../../api/contract';
import Link from 'next/link';
import { ConnectKitButton, useConnectModal } from '../../components/Web3Provider';

const MAX_SUPPLY = 1_000_000_000; // 1B tokens

export default function TokenPage({ addressProp }) {
  const router = useRouter();
  const { openConnectModal } = useConnectModal();
  const { address: routerAddress } = router.query;
  
  // Use prop address if provided, otherwise use router address
  const address = addressProp || routerAddress;
  
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
      
      // Also refresh balance if user is connected
      if (userAddress) {
        const balance = await getTokenBalance(address, userAddress);
        setUserBalance(balance);
      }
    }
  }

  // Update useEffect to use the new address variable
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
      }, 15000);

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
    console.log('Transaction button clicked', { userAddress });
    
    if (!userAddress) {
      console.log('Opening connect modal');
      openConnectModal();
      return;
    }

    setError(""); // Clear previous errors
    const marketType = tokenState?.marketType || 0;

    if (isBuying) {
      const quote = currentQuote;
      if (!quote) return;
      
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
      if (!amount) return;
      
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

  // Update quotes when amount changes
  useEffect(() => {
    if (!amount || !tokenState || !address) return;

    const updateQuote = async () => {
      try {
        setQuoteError(null);
        if (tokenState.marketType === 1) {
          // Uniswap market
          const tokenAmount = parseEther(amount);
          const quote = await getUniswapQuote(
            address,
            tokenState.poolAddress,
            tokenAmount,
            isBuying
          );
          if (isBuying) {
            setUniswapBuyQuote(quote);
          } else {
            setUniswapSellQuote(quote);
          }
        }
      } catch (error) {
        console.error('Quote error:', error);
        setQuoteError('Failed to get quote');
      }
    };

    updateQuote();
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

  // Update button disabled state
  const isQuoteAvailable = useMemo(() => {
    if (!tokenState || !amount) return false;
    
    if (tokenState.marketType === 0) {
      // Bonding curve market
      return isBuying ? 
        (buyQuote !== null && !buyQuoteError) : 
        (sellQuote !== null && !sellQuoteError);
    } else {
      // Uniswap market
      return isBuying ? 
        (uniswapBuyQuote !== null && !quoteError) : 
        (uniswapSellQuote !== null && !quoteError);
    }
  }, [tokenState, amount, isBuying, buyQuote, sellQuote, uniswapBuyQuote, uniswapSellQuote, buyQuoteError, sellQuoteError, quoteError]);

  // Add balance state inside the component
  const [userBalance, setUserBalance] = useState('0');

  // Add effect to fetch and update balance
  useEffect(() => {
    const updateBalance = async () => {
      if (userAddress && address) {
        const balance = await getTokenBalance(address, userAddress);
        setUserBalance(balance);
      } else {
        setUserBalance('0');
      }
    };

    updateBalance();
    
    // Set up periodic refresh
    const balanceInterval = setInterval(updateBalance, 15000);
    return () => clearInterval(balanceInterval);
  }, [userAddress, address]);

  const { data: ethBalance } = useBalance({
    address: userAddress,
    watch: true,
  });

  const handlePercentageClick = (percentage) => {
    if (!userAddress) return;
    
    if (isBuying) {
      // For buying: calculate percentage of ETH balance
      if (!ethBalance?.formatted) return;
      const maxTokens = parseFloat(ethBalance.formatted) / priceInEth;
      const amount = (maxTokens * percentage).toFixed(6);
      setAmount(amount.toString());
    } else {
      // For selling: calculate percentage of token balance
      const amount = (parseFloat(userBalance) * percentage).toFixed(6);
      setAmount(amount.toString());
    }
  };

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
      <div className="border-b border-green-500/30 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Stack vertically on mobile, horizontal on desktop */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="text-2xl font-bold">{tokenState.symbol}</div>
            
            {/* Grid for stats on mobile, flex on desktop */}
            <div className="grid grid-cols-2 md:flex md:space-x-8 gap-4">
              <div>
                <div className="text-sm text-green-500/50">Price</div>
                <div className="text-lg">
                  ${formatUsdPrice(usdPrice)}
                </div>
              </div>
              <div>
                <div className="text-sm text-green-500/50">Market Cap</div>
                <div className="text-lg">
                  {formatMarketCap(marketCapUsd)}
                </div>
              </div>
              <div className="col-span-2 md:col-span-1">
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
      <div className="max-w-4xl mx-auto p-8 space-y-12">
        {/* Current Level */}
        <div className="text-center py-12">
          <div className="text-sm text-green-500/50 mb-4">Current Name</div>
          <div className="text-7xl font-bold mb-6">
            {tokenState.currentName || 'Loading...'}
          </div>
          <div className="text-xl text-green-500/70">
            Level {getCurrentLevelIndex(tokenState) + 1} of {tokenState.priceLevels?.length || 0}
          </div>
        </div>

        {/* Progress Bar (only show if on bonding curve and supply < 800M) */}
        {tokenState.marketType === 0 && parseFloat(tokenState.totalSupply) < 800_000_000 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bonding Curve Progress</span>
              <span>{(parseFloat(tokenState.totalSupply) / 8000000).toFixed(2)}%</span>
            </div>
            <div className="w-full bg-green-500/20 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ width: `${(parseFloat(tokenState.totalSupply) / 8000000)}%` }}
              />
            </div>
          </div>
        )}

        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress to Next Level</span>
            <span>{getProgressToNextLevel(tokenState).toFixed(2)}%</span>
          </div>
          <div className="w-full bg-green-500/20 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${getProgressToNextLevel(tokenState)}%` }}
            />
          </div>
        </div>

        {/* Trading Interface - Moved up */}
        <div className="border border-green-500/30 rounded-lg p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Trade Token</h2>
            <div className="flex flex-col items-end">
              <div className="text-sm text-green-500/70">Your Balance</div>
              <div className="text-lg">
                {Number(userBalance).toLocaleString(undefined, {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 2
                })} {tokenState.symbol}
              </div>
              <div className="text-sm text-green-500/50">
                ${(Number(userBalance) * priceInEth * ethPrice).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setIsBuying(true)}
                className={`px-4 py-2 rounded ${
                  isBuying 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setIsBuying(false)}
                className={`px-4 py-2 rounded ${
                  !isBuying 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm text-green-500/70">Amount in Tokens</label>
              {userAddress && (
                <div className="text-sm text-green-500/50">
                  {isBuying 
                    ? `Available: ${parseFloat(ethBalance?.formatted || '0').toFixed(4)} ETH`
                    : `Available: ${parseFloat(userBalance).toFixed(4)} ${tokenState.symbol}`
                  }
                </div>
              )}
            </div>

            <div className="flex gap-2 mb-2">
              <button
                onClick={() => handlePercentageClick(0.25)}
                className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded"
              >
                25%
              </button>
              <button
                onClick={() => handlePercentageClick(0.5)}
                className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded"
              >
                50%
              </button>
              <button
                onClick={() => handlePercentageClick(0.75)}
                className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded"
              >
                75%
              </button>
              <button
                onClick={() => handlePercentageClick(1)}
                className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded bg-green-500/10"
              >
                APE 🦍
              </button>
            </div>

            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
              placeholder="Enter amount of tokens..."
            />

            <div className="flex justify-between text-sm">
              <span>Current Price</span>
              <span>{tokenState.currentPrice} ETH (${(parseFloat(tokenState.currentPrice) * ethPrice).toFixed(2)})</span>
            </div>

            {error && (
              <div className="text-red-500 text-sm mt-2">
                {error}
              </div>
            )}

            {amount && (
              <div className="space-y-2 p-4 bg-green-500/5 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>{isBuying ? "You'll Pay" : "You'll Receive"}</span>
                  <span>
                    {!isQuoteAvailable ? 'Quote unavailable' : 
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

            {!userAddress ? (
              <ConnectKitButton />
            ) : (
              <button
                onClick={handleTransaction}
                disabled={
                  tokenState.paused || 
                  isLoading || 
                  !amount // Only require an amount
                }
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded transition-colors"
              >
                {isLoading 
                  ? (isBuying ? "Buying..." : "Selling...") 
                  : (isBuying 
                      ? `Buy ${Number(amount).toLocaleString()} Tokens` 
                      : `Sell ${Number(amount).toLocaleString()} Tokens`
                    )
                }
              </button>
            )}
          </div>
        </div>

        {/* Levels Table */}
        <div className="border border-green-500/30 rounded-lg overflow-hidden">
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