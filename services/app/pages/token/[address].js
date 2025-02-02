'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { getTokenState, getProgressToNextLevel, getTokenBalance } from '../../onchain';
import { formatDistanceToNow } from 'date-fns';
import { parseEther, formatEther } from 'viem';
import { higherrrrrrrAbi } from '../../onchain/generated';
import { getEthPrice } from '../../api/price';
import { getLatestTokens } from '../../api/contract';
import Link from 'next/link';
import { ConnectButton, useConnectModal } from '../../components/Web3Provider';
import { getTokenCreator, getToken } from '../../api/token';
import { getBuyQuote, getSellQuote } from '../../onchain/quotes';
import { ethers } from 'ethers';
import { useWallet } from '../../hooks/useWallet';
import { useContract } from '../../hooks/useContract';
import { useDynamicContext, usePrimaryWallet, useChains } from '@dynamic-labs/sdk-react-core';
import { useTransaction } from '../../hooks/useTransaction';
import { formatTokenAmount } from '../../utils/formatters';
import NetworkSwitcher from '../../components/NetworkSwitcher';
import { createPublicClient, custom } from 'viem';

const MAX_SUPPLY = 1_000_000_000; // 1B tokens

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

export default function TokenPage({ addressProp }) {
  const router = useRouter();
  const { openConnectModal } = useConnectModal();
  const { address: routerAddress } = router.query;
  const { address: userAddress } = useWallet();
  const { primaryWallet } = useDynamicContext();
  const { getContract, getSignerContract } = useContract(addressProp || routerAddress, higherrrrrrrAbi);
  const { executeTransaction, isLoading, error: txError } = useTransaction();
  
  const [isCalculatingNft, setIsCalculatingNft] = useState(false);
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
  const [ethBalance, setEthBalance] = useState('0');

  // Add token details state
  const [tokenDetails, setTokenDetails] = useState(null);

  // Use prop address if provided, otherwise use router address
  const tokenAddress = addressProp || routerAddress;

  // Add currentChainType detection
  const currentChainType = primaryWallet?.connector
    ? primaryWallet.connector.name.toLowerCase().includes('phantom')
      ? 'solana'
      : 'base'
    : null;

  // Add this helper function
  const getRequiredChain = (addr) => {
    if (!addr) return 'base'; // default to base if no address
    // You'll need to implement logic to determine if a token is on Base or Solana
    // This is just a placeholder example
    return 'base'; // or 'solana'
  };

  // Add before the trade button
  const requiredChain = getRequiredChain(tokenAddress);

  // Add formatted values using useMemo
  const formattedValues = useMemo(() => {
    if (!tokenState || !ethPrice) return {
      price: '$0.00',
      marketCap: '$0.00',
      supply: '0',
      supplyPercentage: '0%'
    };

    // Add debug logging
    console.log('Token State:', tokenState);
    console.log('ETH Price:', ethPrice);
    console.log('Current Price:', tokenState.currentPrice);

    // Parse values carefully
    const priceInEth = parseFloat(tokenState.currentPrice) || 0;
    const priceInUsd = priceInEth * (ethPrice?.price_usd || ethPrice || 0);
    
    const totalSupply = parseFloat(tokenState.totalSupply) || 0;
    const marketCapUsd = priceInUsd * totalSupply;
    
    const supplyPercentage = (totalSupply / MAX_SUPPLY * 100).toFixed(2);

    // Add debug logging for calculated values
    console.log('Price in ETH:', priceInEth);
    console.log('Price in USD:', priceInUsd);
    console.log('Total Supply:', totalSupply);
    console.log('Market Cap USD:', marketCapUsd);

    return {
      price: `$${formatUsdPrice(priceInUsd)}`,
      marketCap: formatMarketCap(marketCapUsd),
      supply: totalSupply.toLocaleString(undefined, {maximumFractionDigits: 0}),
      supplyPercentage: `${supplyPercentage}%`
    };
  }, [tokenState, ethPrice]);

  // Add the balance effect
  useEffect(() => {
    const updateBalance = async () => {
      if (userAddress && addressProp) {
        const balance = await getTokenBalance(addressProp, userAddress);
        setUserBalance(balance);
      } else {
        setUserBalance('0');
      }
    };

    updateBalance();
    
    // Set up periodic refresh
    const balanceInterval = setInterval(updateBalance, 15000);
    return () => clearInterval(balanceInterval);
  }, [userAddress, addressProp]);

  // Fetch balance when wallet is connected
  useEffect(() => {
    const fetchEthBalance = async () => {
      if (!userAddress || !primaryWallet?.connector) {
        console.log('No wallet connection available');
        setEthBalance('0');
        return;
      }

      try {
        // Get the current chain's provider
        const provider = await primaryWallet.connector.getProvider();
        
        // Create a viem client
        const client = createPublicClient({
          transport: custom(provider)
        });

        // Get balance using viem
        const balance = await client.getBalance({
          address: userAddress
        });

        console.log('ETH balance fetched:', formatEther(balance));
        setEthBalance(formatEther(balance));
      } catch (error) {
        console.error('Error fetching ETH balance:', error);
        setEthBalance('0');
      }
    };

    if (userAddress && primaryWallet?.connector) {
      fetchEthBalance();
      const interval = setInterval(fetchEthBalance, 15000);
      return () => clearInterval(interval);
    }
  }, [primaryWallet?.connector, userAddress]);

  const checkCreator = async () => {
    try {
      if (!primaryWallet?.address) {
        setIsCreator(false);
        return;
      }

      const userAddress = primaryWallet.address.toLowerCase();
      const tokenAddress = addressProp || routerAddress;
      
      if (!tokenAddress) {
        setIsCreator(false);
        return;
      }

      const creatorResponse = await getTokenCreator(tokenAddress);
      console.log('Creator response:', creatorResponse); // Debug log
      
      // If response is an object with a creator property
      const creatorAddress = typeof creatorResponse === 'object' && creatorResponse.creator
        ? creatorResponse.creator
        : typeof creatorResponse === 'string'
          ? creatorResponse
          : null;

      if (!creatorAddress || typeof creatorAddress !== 'string') {
        console.log('Could not extract creator address from response:', creatorResponse);
        setIsCreator(false);
        return;
      }

      setIsCreator(creatorAddress.toLowerCase() === userAddress);
    } catch (error) {
      console.error('Failed to check creator status:', error);
      setIsCreator(false);
    }
  };

  useEffect(() => {
    if (primaryWallet?.address) {
      checkCreator();
    }
  }, [primaryWallet?.address, addressProp, routerAddress]);

  // Add effect to fetch token details
  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!addressProp) return;
      try {
        const details = await getToken(addressProp);
        setTokenDetails(details);
      } catch (error) {
        console.error('Failed to fetch token details:', error);
      }
    };
    fetchTokenDetails();
  }, [addressProp]);

  // Add debug logging to track loading states
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        setLoading(true);
        console.log('Fetching token data for:', addressProp || routerAddress);
        
        // Get token details
        const tokenData = await getToken(addressProp || routerAddress);
        console.log('Token data:', tokenData);
        setToken(tokenData);

        // Get token state
        const state = await getTokenState(addressProp || routerAddress);
        console.log('Token state:', state);
        setTokenState(state);

        // Get ETH price
        const price = await getEthPrice();
        console.log('ETH price:', price);
        setEthPrice(price);

      } catch (error) {
        console.error('Error fetching token data:', error);
        setError('Failed to load token data');
      } finally {
        setLoading(false);
      }
    };

    if (addressProp || routerAddress) {
      fetchTokenData();
    }
  }, [addressProp, routerAddress]);

  // Handle buy transaction
  const handleBuy = async () => {
    if (!userAddress) {
      openConnectModal();
      return;
    }

    try {
      await executeTransaction(async () => {
        const contract = await getSignerContract();
        if (!contract) throw new Error('Contract not initialized');

        const tx = await contract.buy({
          value: ethers.parseEther(amount)
        });
        await tx.wait();
        
        // Refresh states after successful transaction
        refreshTokenState();
        setAmount('');
        setQuote(null);
        setError('');
      });
    } catch (err) {
      console.error('Buy error:', err);
      setError(err.message);
    }
  };

  // Handle sell transaction
  const handleSell = async () => {
    if (!userAddress) {
      openConnectModal();
      return;
    }

    try {
      await executeTransaction(async () => {
        const contract = await getSignerContract();
        if (!contract) throw new Error('Contract not initialized');

        const tx = await contract.sell(ethers.parseEther(amount));
        await tx.wait();
        
        // Refresh states after successful transaction
        refreshTokenState();
        setAmount('');
        setQuote(null);
        setError('');
      });
    } catch (err) {
      console.error('Sell error:', err);
      setError(err.message);
    }
  };

  // Handle transaction based on buy/sell mode
  const handleTransaction = () => {
    if (isBuying) {
      handleBuy();
    } else {
      handleSell();
    }
  };

  // Update useEffect to use the new address variable
  useEffect(() => {
    if (addressProp) {
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
  }, [addressProp]);

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
    if (!amount || !addressProp) {
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
            const quoteWei = await getBuyQuote(addressProp, amountWei);
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
            const quoteWei = await getSellQuote(addressProp, amountWei);
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
              address: addressProp,
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
  }, [amount, addressProp, isBuying]);

  // Update the isQuoteAvailable check
  const isQuoteAvailable = useMemo(() => {
    if (!amount || !quote) return false;
    return true;
  }, [amount, quote]);

  async function refreshTokenState() {
    if (typeof addressProp === 'string') {
      const state = await getTokenState(addressProp);
      setTokenState(state);
      
      // Also refresh balance if user is connected
      if (userAddress) {
        const balance = await getTokenBalance(addressProp, userAddress);
        setUserBalance(balance);
      }
    }
  }

  // Add loading state check
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p>Loading token data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!tokenState) {
    return <div className="text-red-500 font-mono">Token not found</div>;
  }

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

  const handleNftCalculation = async () => {
    try {
      setIsCalculatingNft(true);
      // Your NFT calculation logic here
    } catch (error) {
      console.error('Error calculating NFT:', error);
    } finally {
      setIsCalculatingNft(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Ticker Bar */}
      <div className="p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4">
                <div className="text-xl md:text-2xl font-bold truncate max-w-[300px] md:max-w-[300px]">
                  {tokenState.symbol}
                </div>
                {isCreator && (
                  <Link 
                    href={`/token/${addressProp}/edit`}
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
            
            {/* Grid for stats on mobile, flex on desktop */}
            <div className="grid grid-cols-2 md:flex md:space-x-8 gap-4">
              <div>
                <div className="text-sm text-green-500/50">Price</div>
                <div className="text-lg">
                  {formattedValues.price}
                </div>
              </div>
              <div>
                <div className="text-sm text-green-500/50">Market Cap</div>
                <div className="text-lg">
                  {formattedValues.marketCap}
                </div>
              </div>
              <div>
                <div className="text-sm text-green-500/50">Supply</div>
                <div className="text-lg">
                  {formattedValues.supply}
                  <div className="text-sm text-green-500/70">
                    {formattedValues.supplyPercentage}
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
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.041-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
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
                navigator.clipboard.writeText(addressProp);
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
                href={`https://dexscreener.com/base/${addressProp}`}
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
              href={`https://basescan.org/token/${addressProp}`}
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
                  const ethAmount = await calculateEthForTokenAmount(addressProp, 1_001_001);
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

            {/* Add before the trade button */}
            {primaryWallet && currentChainType !== requiredChain && (
              <NetworkSwitcher targetChain={requiredChain}>
                Switch to {requiredChain} to trade this token
              </NetworkSwitcher>
            )}

            {!userAddress ? (
              <ConnectButton />
            ) : (
              <button
                onClick={handleTransaction}
                disabled={
                  tokenState.paused || 
                  isLoading || 
                  !amount || 
                  currentChainType !== requiredChain ||
                  (isBuying && parseFloat(amount) > parseFloat(ethBalance?.formatted || '0')) ||
                  (!isBuying && parseFloat(amount) > parseFloat(userBalance))
                }
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded transition-colors"
              >
                {isLoading 
                  ? 'Processing...' 
                  : isBuying 
                    ? 'Buy' 
                    : 'Sell'
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
                const levelPriceEth = parseFloat(level.price);
                const levelUsdPrice = levelPriceEth * (ethPrice?.price_usd || 0);
                const levelMarketCap = levelUsdPrice * MAX_SUPPLY; // Use MAX_SUPPLY constant
                const currentPriceEth = parseFloat(tokenState.currentPrice);
                
                // Current level is the one where price >= this level's price but < next level's price
                const nextLevel = tokenState.priceLevels[index + 1];
                const nextLevelPrice = nextLevel ? parseFloat(nextLevel.price) : Infinity;
                const isCurrentLevel = currentPriceEth >= levelPriceEth && currentPriceEth < nextLevelPrice;
                
                // A level is achieved if the current price is higher than its price
                const isAchieved = currentPriceEth >= levelPriceEth;

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