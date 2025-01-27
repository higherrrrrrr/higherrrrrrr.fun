'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getTokenState, getProgressToNextLevel, getTokenBalance } from '../../onchain';
import { useContractWrite, useWaitForTransaction, useContractRead, useAccount, useBalance } from 'wagmi';
import { formatDistanceToNow } from 'date-fns';
import { parseEther, formatEther } from 'viem';
import { higherrrrrrrAbi } from '../../onchain/generated';
import { getEthPrice } from '../../api/price';
import { getLatestTokens } from '../../api/contract';
import Link from 'next/link';
import { ConnectKitButton, useConnectModal } from '../../components/Web3Provider';
import { getTokenCreator, getToken } from '../../api/token';
import { getBuyQuote, getSellQuote } from '../../onchain/quotes';
import { ethers } from 'ethers';
import styles from '../../styles/TokenPage.module.css';

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
  const [token, setToken] = useState(null);
  const [isCreator, setIsCreator] = useState(false);
  const [creator, setCreator] = useState(null);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState('0');

  // Get the user's address
  const { address: userAddress } = useAccount();

  // Add token details state
  const [tokenDetails, setTokenDetails] = useState(null);

  // Add the balance effect
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

  // Add back ethBalance hook
  const { data: ethBalance } = useBalance({
    address: userAddress,
    watch: true,
  });

  useEffect(() => {
    const checkCreator = async () => {
      if (userAddress) {
        try {
          const creatorData = await getTokenCreator(address);
          setCreator(creatorData);
          setIsCreator(
            creatorData.creator.toLowerCase() === userAddress.toLowerCase()
          );
        } catch (error) {
          console.error('Failed to check creator status:', error);
          setIsCreator(false);
        } 
      }
    };
    checkCreator();
  }, [address]);

  // Add effect to fetch token details
  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!address) return;
      try {
        const details = await getToken(address);
        setTokenDetails(details);
      } catch (error) {
        console.error('Failed to fetch token details:', error);
      }
    };
    fetchTokenDetails();
  }, [address]);

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
    onSuccess: () => {
      refreshTokenState();
      // Clear trade state
      setAmount('');
      setQuote(null);
      setError('');
    }
  });

  const { isLoading: isSellLoading } = useWaitForTransaction({
    hash: sellData?.hash,
    onSuccess: () => {
      refreshTokenState();
      // Clear trade state
      setAmount('');
      setQuote(null);
      setError('');
    }
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
          setEthPrice(priceData.price_usd);
        })
        .catch(console.error);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Clean up quote effect
  useEffect(() => {
    if (!amount || !address) {
      setQuote(null);
      return;
    }

    const updateQuote = async () => {
      const MAX_RETRIES = 5;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const amountWei = ethers.parseEther(amount);

          if (isBuying) {
            // For buys, input is ETH amount, quote will be token amount
            const quoteWei = await getBuyQuote(address, amountWei);
            if (quoteWei === BigInt(0)) {
              if (attempt === MAX_RETRIES) {
                console.error('Got zero buy quote after all retries');
                setQuote(null);
                setError('Failed to get quote');
                return;
              }
              continue;
            }
            setQuote(quoteWei);
            setError('');
            return; // Success - exit retry loop
          } else {
            // For sells, input is token amount, quote will be ETH amount
            const quoteWei = await getSellQuote(address, amountWei);
            if (quoteWei === BigInt(0)) {
              if (attempt === MAX_RETRIES) {
                console.error('Got zero sell quote after all retries');
                setQuote(null);
                setError('Failed to get quote');
                return;
              }
              continue;
            }
            setQuote(quoteWei);
            setError('');
            return; // Success - exit retry loop
          }
        } catch (error) {
          if (attempt === MAX_RETRIES) {
            console.error('Error in quote effect after all retries:', {
              error,
              address,
              amount,
              isBuying,
              attempt
            });
            setQuote(null);
            setError('Failed to get quote');
            return;
          }
          continue;
        }
      }
    };

    updateQuote();
  }, [amount, address, isBuying]);

  // Update the isQuoteAvailable check
  const isQuoteAvailable = useMemo(() => {
    if (!amount || !quote) return false;
    return true;
  }, [amount, quote]);

  // Update the transaction handler to use the correct amounts
  const handleTransaction = () => {
    if (!userAddress) {
      openConnectModal();
      return;
    }

    setError(''); // Clear previous errors
    const marketType = tokenState?.marketType || 0;

    if (isBuying) {
      // For buys: amount is in ETH, use it directly as value
      if (!amount) return;
      buyToken({
        value: ethers.parseEther(amount), // Use input amount as ETH value
        args: [
          userAddress,
          userAddress,
          '',
          marketType,
          parseEther(MIN_ETH_AMOUNT),
          0
        ]
      });
    } else {
      // For sells: amount is in tokens, use it as token amount
      if (!amount) return;
      sellToken({
        args: [
          parseEther(amount), // Use input amount as token amount
          userAddress,
          '',
          marketType,
          parseEther(MIN_ETH_AMOUNT),
          0
        ]
      });
    }
  };

  // Define MIN_ETH_AMOUNT as a string instead of bigint
  const MIN_ETH_AMOUNT = "0.0000001";

  // Update handlePercentageClick function
  const handlePercentageClick = (percentage) => {
    if (!userAddress) return;
    
    if (isBuying) {
      // For buying: calculate percentage of ETH balance
      if (!ethBalance?.formatted) return;
      // If it's 100% (APE), use 98% instead to leave room for gas
      const actualPercentage = percentage === 1 ? 0.98 : percentage;
      const maxEthToSpend = parseFloat(ethBalance.formatted) * actualPercentage;
      // For buys, we input ETH amount directly
      setAmount(maxEthToSpend.toFixed(6));
    } else {
      // For selling: calculate percentage of token balance
      // For selling we can use full percentage since gas is paid in ETH
      const amount = (parseFloat(userBalance) * percentage).toFixed(6);
      setAmount(amount.toString());
    }
  };

  // Add this helper function at the top with other functions
  async function getTokenBuyQuoteForEth(tokenAddress, ethAmount) {
    try {
      const contract = {
        address: tokenAddress,
        abi: higherrrrrrrAbi,
      };
      
      const data = await readContract({
        ...contract,
        functionName: 'getTokensForEth',
        args: [parseEther(ethAmount.toString())],
      });
      
      return formatEther(data);
    } catch (error) {
      console.error('Error getting token buy quote:', error);
      return '0';
    }
  }

  // Add this with the other handlers
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

  // Add this helper function near the other formatting functions
  const formatTokenAmount = (amount) => {
    const num = parseFloat(amount);
    if (isNaN(num)) return '0';
    
    // Always use regular decimal notation
    return num.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 6,
      useGrouping: true,
      notation: 'standard'
    });
  };

  // Add this helper function near the other calculation functions
  const calculateEthForTokenAmount = async (tokenAddress, targetTokens) => {
    try {
      setIsCalculatingNft(true);
      const TARGET = parseEther((targetTokens).toString());
      
      // First get a sell quote for this amount to approximate the range
      const sellQuote = await getSellQuote(tokenAddress, TARGET);
      if (!sellQuote || sellQuote === BigInt(0)) {
        throw new Error("Could not get initial sell quote");
      }
      
      // Use sell quote to establish reasonable bounds
      // Start with ±20% of the sell quote for the search range
      let low = (sellQuote * BigInt(1)) / BigInt(100);   // 1% of sell quote
      let high = (sellQuote * BigInt(420)) / BigInt(100); // 420% of sell quote
      
      // Binary search with tighter bounds
      for (let i = 0; i < 20; i++) { // Fewer iterations needed now
        const mid = (low + high) / BigInt(2);
        const quote = await getBuyQuote(tokenAddress, mid);
        
        // If we're within 1% of target, this is good enough
        if (quote > TARGET * BigInt(990) / BigInt(1000) && 
            quote < TARGET * BigInt(1010) / BigInt(1000)) {
          // Add 5% slippage buffer to final amount
          const withSlippage = (mid * BigInt(105)) / BigInt(100);
          return formatEther(withSlippage);
        }
        
        if (quote < TARGET) {
          low = mid;
        } else {
          high = mid;
        }
      }
      throw new Error("Could not converge on exact amount");
    } catch (error) {
      console.error('Error calculating ETH for tokens:', error);
      return null;
    } finally {
      setIsCalculatingNft(false);
    }
  };

  // Add these to your state declarations at the top
  const [isCalculatingNft, setIsCalculatingNft] = useState(false);

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

  // Update the getCurrentLevelIndex function to use price
  const getCurrentLevelIndex = (tokenState) => {
    if (!tokenState?.priceLevels || !tokenState?.currentPrice) return -1;
    const currentPriceEth = parseFloat(tokenState.currentPrice);
    
    // Find the highest level where the current price meets or exceeds the level price
    return tokenState.priceLevels.reduce((highestIndex, level, index) => {
      const levelPrice = parseFloat(level.price);
      return currentPriceEth >= levelPrice ? index : highestIndex;
    }, -1);
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Ticker Bar */}
      <div className="p-4">
        <div className={`max-w-4xl mx-auto ${styles['token-header']}`}>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4">
                <div className={`text-xl md:text-2xl font-bold truncate max-w-[300px] md:max-w-[300px] ${styles['token-symbol']}`}>
                  {tokenState.symbol}
                </div>
                {isCreator && (
                  <Link 
                    href={`/token/${address}/edit`}
                    className="inline-flex items-center px-3 py-1 border border-green-500 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors text-sm"
                  >
                    <span>Edit</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </Link>
                )}
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className={`grid grid-cols-2 md:flex md:space-x-8 gap-4 ${styles['token-stats']}`}>
              <div className={styles['stat-card']}>
                <div className="text-sm text-green-500/50">Price</div>
                <div className={`text-lg ${styles['stat-value']}`}>
                  ${formatUsdPrice(usdPrice)}
                </div>
              </div>
              <div className={styles['stat-card']}>
                <div className="text-sm text-green-500/50">Market Cap</div>
                <div className={`text-lg ${styles['stat-value']}`}>
                  {formatMarketCap(marketCapUsd)}
                </div>
              </div>
              <div className={styles['stat-card']}>
                <div className="text-sm text-green-500/50">Supply</div>
                <div className={`text-lg ${styles['stat-value']}`}>
                  {totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0})}
                  <div className="text-sm text-green-500/70">
                    {((totalSupply / 1_000_000_000) * 100).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Description & Links Section */}
      <div className="max-w-4xl mx-auto px-4 pb-4">
        <div className="flex flex-col gap-4">
          {/* Social Links */}
          {(tokenDetails?.website || tokenDetails?.twitter || tokenDetails?.telegram || tokenDetails?.warpcast_url) && (
            <div>
              <div className="text-sm text-green-500/50 mb-2">Socials</div>
              <div className="flex gap-3">
                {tokenDetails?.website && (
                  <a
                    href={tokenDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500/70 hover:text-green-500 transition-colors"
                    title="Website"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </a>
                )}
                
                {tokenDetails?.twitter && (
                  <a
                    href={tokenDetails.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500/70 hover:text-green-500 transition-colors"
                    title="Twitter"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
                
                {tokenDetails?.telegram && (
                  <a
                    href={tokenDetails.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500/70 hover:text-green-500 transition-colors"
                    title="Telegram"
                  >
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  </a>
                )}
                
                {tokenDetails?.warpcast_url && (
                  <a
                    href={tokenDetails.warpcast_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-500/70 hover:text-green-500 transition-colors"
                    title="Warpcast"
                  >
                    <img 
                      src="/warpcast.png" 
                      alt="Warpcast"
                      className="h-5 w-5 opacity-70 hover:opacity-100 transition-opacity"
                    />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {tokenDetails?.description && (
            <div>
              <div className="text-sm text-green-500/50 mb-2">Description</div>
              <p className="text-green-500/80 leading-relaxed mb-3">
                {tokenDetails.description}
              </p>
            </div>
          )}

          {/* External Links - Always show */}
          <div className="flex flex-wrap gap-2 pt-1">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(address);
              }}
              className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded flex items-center gap-1"
            >
              <span>Copy Address</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>

            {tokenState?.marketType === 1 && (
              <a
                href={`https://dexscreener.com/base/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded flex items-center gap-1"
              >
                <span>DexScreener</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}

            <a
              href={`https://basescan.org/token/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-1 text-xs border border-green-500/30 hover:border-green-500 rounded flex items-center gap-1"
            >
              <span>Basescan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Green divider moved here */}
      <div className="border-b border-green-500/30" />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-12">
        {/* Current Level */}
        <div className="text-center py-12">
          <div className="text-sm text-green-500/50 mb-4">Current Name</div>
          <div className="text-xl md:text-7xl font-bold mb-6 break-words max-w-[90vw] mx-auto">
            {tokenState.currentName || 'Loading...'}
          </div>
          <div className="text-lg md:text-xl text-green-500/70">
            Level {getCurrentLevelIndex(tokenState) + 1} of {tokenState.priceLevels?.length || 0}
          </div>
        </div>

        {/* Progress Bar (only show if on bonding curve and supply < 800M) */}
        {tokenState.marketType === 0 && parseFloat(tokenState.totalSupply) < 800_000_000 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Bonding Curve Progress</span>
              <span>
                {(() => {
                  const supply = parseFloat(tokenState.totalSupply);
                  const target = 800_000_000;
                  return ((supply / target) * 100).toFixed(2);
                })()}%
              </span>
            </div>
            <div className="w-full bg-green-500/20 rounded-full h-4">
              <div 
                className="bg-green-500 h-4 rounded-full transition-all"
                style={{ 
                  width: `${(parseFloat(tokenState.totalSupply) / 800_000_000 * 100)}%`
                }}
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

        {/* Chart Section - Only show for graduated tokens */}
        {tokenState?.marketType === 1 && tokenState?.poolAddress && (
          <div className="relative border border-green-500/30 rounded-lg overflow-hidden">
            {/* Chart iframe */}
            <iframe
              src={`https://www.geckoterminal.com/base/pools/${tokenState.poolAddress}?embed=1&info=0&swaps=0&chart=1`}
              width="100%"
              height="400px"
              frameBorder="0"
              className="relative z-0 bg-black"
              title="Price Chart"
              style={{
                filter: 'brightness(90%) grayscale(100%) sepia(100%) hue-rotate(70deg) saturate(150%) contrast(150%)',
                backgroundColor: 'black',
              }}
            />
          </div>
        )}

        {/* Trading Interface */}
        <div className="border border-green-500/30 rounded-lg p-4 md:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {/* Token Trade Header */}
            <div className="flex-shrink-0">
              <h2 className="text-xl font-bold">
                <div className="flex items-center gap-2">
                  <span>Trade</span>
                  <span className="truncate max-w-[195px]" title={tokenState.symbol}>
                    {tokenState.symbol}
                  </span>
                </div>
              </h2>
            </div>

            {/* Balance Section - Improved layout */}
            <div className="w-full sm:w-auto flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-start">
              <div className="text-sm text-green-500/70">Your Balance</div>
              <div>
                <div className="text-lg text-right flex items-center justify-end gap-1">
                  <span className="font-mono">
                    {formatTokenAmount(userBalance)}
                  </span>
                  <span className="truncate max-w-[130px]" title={tokenState.symbol}>
                    {tokenState.symbol}
                  </span>
                </div>
                <div className="text-sm text-green-500/50 text-right">
                  ${(Number(userBalance) * priceInEth * ethPrice).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>

            {/* Buy/Sell Buttons */}
            <div className="w-full sm:w-auto flex space-x-2 justify-end">
              <button
                onClick={() => {
                  setIsBuying(true);
                  setAmount('');
                }}
                className={`px-4 py-2 rounded flex-1 sm:flex-none ${
                  isBuying 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => {
                  setIsBuying(false);
                  setAmount('');
                }}
                className={`px-4 py-2 rounded flex-1 sm:flex-none ${
                  !isBuying 
                    ? 'bg-green-500 text-black' 
                    : 'border border-green-500 text-green-500'
                }`}
              >
                Sell
              </button>
            </div>
          </div>

          {/* Amount Input Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <label className="text-sm text-green-500/70">
                {isBuying ? "Amount in ETH" : "Amount in Tokens"}
              </label>
              {userAddress && (
                <div className="text-sm text-green-500/50 flex items-center gap-1">
                  <span>Available:</span>
                  <span className="font-mono">
                    {isBuying 
                      ? `${parseFloat(ethBalance?.formatted || '0').toFixed(6)} ETH`
                      : `${formatTokenAmount(userBalance)} ${tokenState.symbol}`
                    }
                  </span>
                  {!isBuying && (
                    <span className="truncate max-w-[104px]" title={tokenState.symbol}>
                      {tokenState.symbol}
                    </span>
                  )}
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
              
              {/* NFT Buy Button */}
              <button
                onClick={async () => {
                  const ethAmount = await calculateEthForTokenAmount(address, 1_001_001);
                  if (ethAmount) {
                    setIsBuying(true); // Ensure we're in buy mode
                    handleAmountChange(ethAmount);
                  }
                }}
                disabled={isCalculatingNft}
                className="px-3 py-1 text-xs border border-green-500/30 hover:border-green-500 hover:bg-green-500/10 rounded transition-all flex items-center gap-2"
              >
                {isCalculatingNft ? (
                  <>
                    <span className="animate-pulse">Calculating...</span>
                    <div className="w-3 h-3 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                  </>
                ) : (
                  <>
                    <span>NFT 🎨</span>
                    <span className="text-green-500/50">(1M)</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
              placeholder={isBuying ? "Enter amount in ETH..." : "Enter amount in tokens..."}
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
                  <span>{isBuying ? "You'll Get" : "You'll Receive"}</span>
                  <span>
                    {!isQuoteAvailable ? 'Quote unavailable' : 
                     quote ? (isBuying 
                       ? `${formatTokenAmount(formatEther(quote))} ${tokenState.symbol}` // For buys, format token amount
                       : `${parseFloat(formatEther(quote)).toFixed(6)} ETH` // For sells, keep ETH precision
                     ) : '...'}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-green-500/70">
                  <span>USD Value</span>
                  <span>
                    {!isQuoteAvailable ? '-' :
                     quote ? `$${(parseFloat(formatEther(quote)) * (isBuying ? usdPrice : ethPrice)).toFixed(2)}` : '...'}
                  </span>
                </div>
                
                {/* Add balance warnings */}
                {isBuying && parseFloat(amount) > parseFloat(ethBalance?.formatted || '0') && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Insufficient ETH balance</span>
                  </div>
                )}
                {!isBuying && parseFloat(amount) > parseFloat(userBalance) && (
                  <div className="text-red-500 text-sm mt-2 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>Insufficient token balance</span>
                  </div>
                )}

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
                  !amount || // require amount
                  (isBuying && parseFloat(amount) > parseFloat(ethBalance?.formatted || '0')) || // check ETH balance
                  (!isBuying && parseFloat(amount) > parseFloat(userBalance)) // check token balance
                }
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded transition-colors"
              >
                {isLoading 
                  ? (isBuying ? "Buying..." : "Selling...") 
                  : (isBuying 
                      ? quote 
                        ? `Buy ~${formatTokenAmount(formatEther(quote))} ${tokenState.symbol}` 
                        : `Buy ${tokenState.symbol}`
                      : `Sell ${formatTokenAmount(amount)} ${tokenState.symbol}`
                    )
                }
              </button>
            )}
          </div>
        </div>

        {/* Levels Table */}
        <div className="border border-green-500/30 rounded-lg overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-500/30">
                <th className="p-4 text-left whitespace-nowrap">Level</th>
                <th className="p-4 text-left">
                  <div className="max-w-[260px] truncate">Name</div>
                </th>
                <th className="p-4 text-right whitespace-nowrap">Price</th>
                <th className="p-4 text-right whitespace-nowrap">Market Cap</th>
                <th className="p-4 text-center whitespace-nowrap">State</th>
              </tr>
            </thead>
            <tbody>
              {tokenState.priceLevels.map((level, index) => {
                const levelUsdPrice = parseFloat(level.price) * ethPrice;
                const levelMarketCap = levelUsdPrice * MAX_SUPPLY;
                const currentPriceEth = parseFloat(tokenState.currentPrice);
                
                // Current level is the one where price >= this level's price but < next level's price
                const nextLevel = tokenState.priceLevels[index + 1];
                const nextLevelPrice = nextLevel ? parseFloat(nextLevel.price) : Infinity;
                const isCurrentLevel = currentPriceEth >= parseFloat(level.price) && currentPriceEth < nextLevelPrice;
                
                // A level is achieved if the current price is higher than its price
                const isAchieved = currentPriceEth >= parseFloat(level.price) && !isCurrentLevel;

                return (
                  <tr key={index} className={`border-b border-green-500/10 ${isCurrentLevel ? 'bg-green-500/10' : ''}`}>
                    <td className="p-4 whitespace-nowrap">{index + 1}</td>
                    <td className="p-4">
                      <div className="max-w-[260px] truncate" title={level.name}>
                        {level.name}
                      </div>
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {index === 0 ? (
                        'Free'
                      ) : (
                        `$${formatUsdPrice(levelUsdPrice)}`
                      )}
                    </td>
                    <td className="p-4 text-right whitespace-nowrap">
                      {index === 0 ? (
                        '-'
                      ) : (
                        formatMarketCap(levelMarketCap)
                      )}
                    </td>
                    <td className="p-4 text-center whitespace-nowrap">
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