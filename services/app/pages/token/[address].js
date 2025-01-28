'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getTokenState, getProgressToNextLevel, getSolBalance, buyTokenSol, sellTokenSol, getBuyQuoteSol, getSellQuoteSol } from '../../onchain/solana';
import { formatDistanceToNow } from 'date-fns';
import { getSolPrice } from '../../api/price';
import { getTokenCreator, getToken } from '../../api/token';
import Link from 'next/link';
import Image from 'next/image';
import { ConnectWalletButton, useWallet } from '../../components/Web3Provider';
import styles from '../../styles/TokenPage.module.css';
import { CountdownTimer } from '../components/CountdownTimer';

const MAX_SUPPLY = 1_000_000_000; // 1B tokens
const MIN_SOL_AMOUNT = 0.0000001;
const QUOTE_DEBOUNCE_MS = 300;

// Helper functions
function shouldShowLaunchProgress(launchDate) {
  if (!launchDate) return false;
  return new Date(launchDate) > new Date();
}

function getProgressToNextLevel(tokenState) {
  if (!tokenState || !tokenState.volume || !tokenState.volumeToNextLevel) return 0;
  const progress = (parseFloat(tokenState.volume) / parseFloat(tokenState.volumeToNextLevel)) * 100;
  return Math.min(100, Math.max(0, progress));
}

function formatMarketCap(marketCapUsd) {
  if (!marketCapUsd) return 'N/A';
  if (marketCapUsd >= 1_000_000_000) return `$${(marketCapUsd / 1_000_000_000).toFixed(2)}B`;
  if (marketCapUsd >= 1_000_000) return `$${(marketCapUsd / 1_000_000).toFixed(2)}M`;
  if (marketCapUsd >= 1_000) return `$${(marketCapUsd / 1_000).toFixed(2)}K`;
  return `$${marketCapUsd.toFixed(2)}`;
}

function formatUsdPrice(price) {
  if (!price) return 'N/A';
  if (price < 0.000001) return `$${price.toExponential(2)}`;
  if (price < 0.01) return `$${price.toFixed(6)}`;
  if (price < 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(2)}`;
}

function formatSolAmount(amount) {
  return parseFloat(amount).toFixed(6);
}

function getTimeToLaunchProgress(launchDate) {
  if (!launchDate) return 0;
  const now = new Date();
  const launch = new Date(launchDate);
  
  if (launch <= now) return 0;
  
  const total = launch - now;
  const maxDuration = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return Math.max(0, Math.min(100, (1 - (total / maxDuration)) * 100));
}

export default function TokenPage({ addressProp }) {
  const router = useRouter();
  const { address: routerAddress } = router.query;
  const address = addressProp || routerAddress;
  
  const [isTradeExpanded, setIsTradeExpanded] = useState(false);
  const [tokenState, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [solPrice, setSolPrice] = useState(0);
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [userBalance, setUserBalance] = useState('0');
  const [tokenDetails, setTokenDetails] = useState(null);

  const wallet = useWallet();
  const { publicKey, connected } = wallet;

  // Update balance when wallet connects
  useEffect(() => {
    if (!connected || !publicKey) return;
    
    const fetchBalance = async () => {
      try {
        const balance = await getSolBalance(publicKey.toString());
        setUserBalance(balance);
      } catch (err) {
        console.error('Failed to fetch balance:', err);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 15000);
    return () => clearInterval(interval);
  }, [connected, publicKey]);

  // Fetch token data
  useEffect(() => {
    if (!address) return;

    const fetchTokenData = async () => {
      try {
        setLoading(true);
        const [details, state, price] = await Promise.all([
          getToken(address),
          getTokenState(address),
          getSolPrice()
        ]);
        
        setTokenDetails(details);
        setTokenState(state);
        setSolPrice(price.price_usd);
      } catch (error) {
        console.error('Failed to fetch token data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTokenData();
    const interval = setInterval(fetchTokenData, 15000);
    return () => clearInterval(interval);
  }, [address]);

  // Handle amount changes with validation
  const handleAmountChange = (value) => {
    if (value === '') {
      setAmount('');
      setQuote(null);
      return;
    }

    const numValue = value.replace(/,/g, '');
    if (isNaN(numValue) || !isFinite(parseFloat(numValue))) {
      return;
    }

    const parsedAmount = parseFloat(numValue);
    if (parsedAmount < MIN_SOL_AMOUNT) {
      setError(`Minimum amount is ${MIN_SOL_AMOUNT} SOL`);
    } else {
      setError('');
    }

    setAmount(formatSolAmount(numValue));
  };

  // Handle percentage clicks with improved validation
  const handlePercentageClick = (percentage) => {
    if (!connected || !publicKey) {
      setError('Please connect your wallet to trade');
      return;
    }
    
    if (isBuying) {
      const maxSolToSpend = parseFloat(userBalance) * (percentage === 1 ? 0.98 : percentage);
      if (maxSolToSpend < MIN_SOL_AMOUNT) {
        setError(`Amount too small. Minimum is ${MIN_SOL_AMOUNT} SOL`);
        return;
      }
      setAmount(formatSolAmount(maxSolToSpend));
    } else {
      const tokenAmount = (parseFloat(tokenState.balance) * percentage);
      setAmount(formatSolAmount(tokenAmount));
    }
  };

  // Handle transactions with improved error handling
  const handleTransaction = async () => {
    if (!connected || !publicKey) {
      setError('Wallet not connected. Please connect your wallet to proceed.');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError(`Please enter an amount greater than ${MIN_SOL_AMOUNT} SOL`);
      return;
    }

    if (parseFloat(amount) < MIN_SOL_AMOUNT) {
      setError(`Minimum transaction amount is ${MIN_SOL_AMOUNT} SOL`);
      return;
    }

    try {
      const formattedAmount = formatSolAmount(amount);
      
      if (isBuying) {
        if (parseFloat(formattedAmount) > parseFloat(userBalance)) {
          setError('Insufficient SOL balance for this transaction');
          return;
        }
        await buyTokenSol(address, formattedAmount, wallet);
      } else {
        if (parseFloat(formattedAmount) > parseFloat(tokenState.balance)) {
          setError('Insufficient token balance for this transaction');
          return;
        }
        await sellTokenSol(address, formattedAmount, wallet);
      }
      
      // Refresh state after transaction
      const [newState, newBalance] = await Promise.all([
        getTokenState(address),
        getSolBalance(publicKey.toString())
      ]);
      
      setTokenState(newState);
      setUserBalance(newBalance);
      setAmount('');
      setQuote(null);
      setError('');
    } catch (err) {
      console.error('Transaction failed:', err);
      setError(`Transaction failed: ${err.message || 'Please try again'}`);
    }
  };

  // Debounced quote fetching
  useEffect(() => {
    const debounceTimer = setTimeout(async () => {
      if (!amount || !address) {
        setQuote(null);
        return;
      }

      try {
        const formattedAmount = formatSolAmount(amount);
        const quoteAmount = isBuying
          ? await getBuyQuoteSol(address, formattedAmount)
          : await getSellQuoteSol(address, formattedAmount);
        
        setQuote(quoteAmount);
        setError('');
      } catch (err) {
        console.error('Failed to get quote:', err);
        setQuote(null);
        setError('Unable to get quote. Please try again.');
      }
    }, QUOTE_DEBOUNCE_MS);

    return () => clearTimeout(debounceTimer);
  }, [amount, isBuying, address]);

  // Loading state with skeleton
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-green-500/20 rounded w-1/3 mb-4"></div>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="h-12 bg-green-500/20 rounded"></div>
                <div className="h-12 bg-green-500/20 rounded"></div>
              </div>
              <div className="h-64 bg-green-500/20 rounded mb-8"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenState) {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono flex justify-center items-center">
        <div className="text-red-500">Token not found</div>
      </div>
    );
  }

  if (tokenDetails?.status === 'coming-soon') {
    return (
      <div className="min-h-screen bg-black text-green-500 font-mono">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{tokenDetails.name}</h1>

            {/* Launch Countdown */}
            {timeToLaunch && (
              <div className="mb-8 p-6 border border-green-500/20 rounded-lg">
                <h2 className="text-xl font-bold mb-2">Launching {timeToLaunch}</h2>
                <div className="w-full bg-green-500/20 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${getTimeToLaunchProgress(tokenDetails.launchDate)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="text-green-500/80 whitespace-pre-wrap">
                {tokenDetails.description}
              </div>
            </div>
            
            {/* Custom Content */}
            {tokenDetails.customContent && (
              <div 
                className="mb-8 text-green-500/80"
                dangerouslySetInnerHTML={{ __html: tokenDetails.customContent }}
              />
            )}

            {/* Social Links */}
            <div className="flex gap-4 mb-8">
              {tokenDetails.website && (
                <a
                  href={tokenDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400"
                >
                  Website
                </a>
              )}
              {tokenDetails.twitter && (
                <a
                  href={tokenDetails.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400"
                >
                  Twitter
                </a>
              )}
              {tokenDetails.telegram && (
                <a
                  href={tokenDetails.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-500 hover:text-green-400"
                >
                  Telegram
                </a>
              )}
            </div>

            {/* Gallery with correct path structure */}
            {tokenDetails.galleryImages?.length > 0 && (
              <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
                {tokenDetails.galleryImages.map((img, i) => (
                  <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-green-500/20">
                    <Image
                      src={`/images/gallery/${tokenDetails.slug}/${img}`}
                      alt={`${tokenDetails.name} Image ${i + 1}`}
                      layout="fill"
                      objectFit="cover"
                      priority={i < 6}
                      className="hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Token Info */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-4">{tokenState.symbol}</h1>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-green-500/70">Price</div>
                <div className="text-xl">{formatUsdPrice(tokenState.currentPrice * solPrice)}</div>
              </div>
              <div>
                <div className="text-sm text-green-500/70">Market Cap</div>
                <div className="text-xl">{formatMarketCap(tokenState.currentPrice * solPrice * MAX_SUPPLY)}</div>
              </div>
            </div>
          </div>

          {/* Trading Interface */}
          <div className="mb-8">
            <button 
              onClick={() => setIsTradeExpanded(!isTradeExpanded)}
              className="w-full p-4 border border-green-500/20 rounded-lg hover:border-green-500/40 transition-colors flex items-center justify-between"
            >
              <span className="text-lg">Trade {tokenState.symbol}</span>
              <svg 
                className={`w-5 h-5 transition-transform duration-300 ${isTradeExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Expandable Trading Terminal */}
            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
              isTradeExpanded ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}>
              <div className="card p-6 border border-green-500/20 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-xl font-bold">Terminal</div>
                  {!connected && <ConnectWalletButton />}
                </div>
                
                {/* Trading Tabs */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setIsBuying(true)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      isBuying ? 'bg-green-500 text-black' : 'text-green-500 hover:bg-green-500/10'
                    }`}
                  >
                    Buy
                  </button>
                  <button
                    onClick={() => setIsBuying(false)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      !isBuying ? 'bg-green-500 text-black' : 'text-green-500 hover:bg-green-500/10'
                    }`}
                  >
                    Sell
                  </button>
                </div>

                {/* Amount Input */}
                <div className="mb-4">
                  <label className="block text-sm text-green-500/70 mb-2">
                    {isBuying ? 'SOL Amount' : 'Token Amount'}
                  </label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full bg-black border border-green-500/20 rounded-lg p-2 text-green-500 focus:outline-none focus:border-green-500"
                    placeholder={`Min ${MIN_SOL_AMOUNT} SOL`}
                  />
                </div>

                {/* Percentage Buttons */}
                <div className="flex gap-2 mb-4">
                  {[0.25, 0.5, 0.75, 1].map((percentage) => (
                    <button
                      key={percentage}
                      onClick={() => handlePercentageClick(percentage)}
                      className="flex-1 px-2 py-1 border border-green-500/20 rounded-lg hover:bg-green-500/10 transition-colors text-sm"
                    >
                      {percentage * 100}%
                    </button>
                  ))}
                </div>

                {/* Quote Display */}
                {quote && (
                  <div className="mb-4 p-3 border border-green-500/20 rounded-lg">
                    <div className="text-sm text-green-500/70 mb-1">You will receive</div>
                    <div className="text-lg">
                      {isBuying
                        ? `${formatSolAmount(quote)} ${tokenState.symbol}`
                        : `${formatSolAmount(quote)} SOL`}
                    </div>
                  </div>
                )}

                {/* Error Display */}
                {error && (
                  <div className="mb-4 p-3 border border-red-500/20 rounded-lg text-red-500">
                    {error}
                  </div>
                )}

                {/* Trade Button */}
                <button
                  onClick={handleTransaction}
                  disabled={!quote || loading}
                  className={`w-full p-3 rounded-lg transition-colors ${
                    quote && !loading
                      ? 'bg-green-500 text-black hover:bg-green-600'
                      : 'bg-green-500/20 text-green-500/50 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'Processing...' : isBuying ? 'Buy' : 'Sell'}
                </button>
              </div>
            </div>
          </div>

          {/* Token Description */}
          {tokenDetails?.description && (
            <div className="mt-8">
              <div className="text-green-500/80 leading-relaxed whitespace-pre-wrap">
                {tokenDetails.description}
              </div>
            </div>
          )}

          {/* Image Gallery */}
          {tokenDetails?.galleryImages?.length > 0 ? (
            <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
              {tokenDetails.galleryImages.map((img, i) => (
                <div key={i} className="aspect-square relative rounded-lg overflow-hidden border border-green-500/20">
                  <Image
                    src={`/images/gallery/${tokenDetails.slug}/${img}`}
                    alt={`${tokenDetails.name} Image ${i + 1}`}
                    layout="fill"
                    objectFit="cover"
                    priority={i < 6}
                    className="hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-center text-green-500/70">No images available for this project.</p>
          )}
        </div>
      </div>
    </div>
  );
}