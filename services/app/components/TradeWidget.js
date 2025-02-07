'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useSwitchChain } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { higherrrrrrrAbi } from '../onchain/generated';
import { getBuyQuote, getSellQuote } from '../onchain/quotes';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import DynamicConnectButton from './DynamicConnectButton';
import { base as wagmiBase } from 'wagmi/chains';
import { formatUsdPrice } from '../utils/format';

const MIN_ETH_AMOUNT = "0.0000001";

function formatTokenAmount(amount) {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return parseFloat(num.toFixed(6)).toString();
}

export default function TradeWidget({ 
  tokenState, 
  address, 
  userBalance, 
  ethPrice,
  onTradeComplete 
}) {
  const [amount, setAmount] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [isCalculatingNft, setIsCalculatingNft] = useState(false);

  const { address: userAddress, chain } = useAccount();
  const { setShowAuthFlow } = useDynamicContext();
  
  const { data: ethBalance } = useBalance({
    address: userAddress,
    chainId: wagmiBase.id,
    enabled: !!userAddress,
  });

  console.log('ethBalance', ethBalance);

  useEffect(() => {
    if (ethBalance) {
      console.log('ETH Balance Details:', {
        formatted: ethBalance.formatted,
        value: ethBalance.value.toString(),
        symbol: ethBalance.symbol,
        chainId: chain?.id,
        expectedChainId: wagmiBase.id,
        userAddress,
        isBaseChain: chain?.id === wagmiBase.id
      });
    }
  }, [ethBalance, chain, userAddress]);

  useEffect(() => {
    if (chain) {
      console.log('Current Chain:', {
        id: chain.id,
        name: chain.name,
        isBase: chain.id === wagmiBase.id,
        baseChainId: wagmiBase.id
      });
    }
  }, [chain]);

  const { 
    writeContract: buyToken,
    data: buyHash,
    isPending: isBuyPending,
    error: buyError,
    isError: isBuyError
  } = useWriteContract();

  const { 
    writeContract: sellToken,
    data: sellHash,
    isPending: isSellPending,
    error: sellError,
    isError: isSellError
  } = useWriteContract();

  const { isLoading: isBuyLoading, isSuccess: isBuySuccess } = useWaitForTransactionReceipt({
    hash: buyHash,
    chainId: wagmiBase?.id,
    onSuccess: () => {
      onTradeComplete?.();
      setAmount('');
      setQuote(null);
      setError('');
    }
  });

  const { isLoading: isSellLoading, isSuccess: isSellSuccess } = useWaitForTransactionReceipt({
    hash: sellHash,
    chainId: wagmiBase?.id,
    onSuccess: () => {
      onTradeComplete?.();
      setAmount('');
      setQuote(null);
      setError('');
    }
  });

  const isLoading = isBuyLoading || isSellLoading || isBuyPending || isSellPending;

  useEffect(() => {
    if (chain && wagmiBase && chain.id !== wagmiBase.id) {
      setError('Please switch to Base network');
    } else {
      setError('');
    }
  }, [chain]);

  const { switchChain } = useSwitchChain();

  const handlePercentageClick = (percentage) => {
    if (!userAddress) return;
    
    if (isBuying) {
      if (!ethBalance?.formatted) return;
      const actualPercentage = percentage === 1 ? 0.98 : percentage;
      const maxEthToSpend = parseFloat(ethBalance.formatted) * actualPercentage;
      setAmount(maxEthToSpend.toFixed(6));
    } else {
      const amount = (parseFloat(userBalance) * percentage).toFixed(6);
      setAmount(amount.toString());
    }
  };

  const handleAmountChange = (value) => {
    if (value === '') {
      setAmount('');
      return;
    }

    const numValue = value.replace(/,/g, '');
    if (isNaN(numValue) || !isFinite(parseFloat(numValue))) {
      return;
    }

    setAmount(numValue);
  };

  const calculateEthForTokenAmount = async (tokenAddress, targetTokens) => {
    try {
      setIsCalculatingNft(true);
      const TARGET = parseEther((targetTokens).toString());
      
      const sellQuote = await getSellQuote(tokenAddress, TARGET);
      if (!sellQuote || sellQuote === BigInt(0)) {
        throw new Error("Could not get initial sell quote");
      }
      
      let low = (sellQuote * BigInt(1)) / BigInt(100);
      let high = (sellQuote * BigInt(420)) / BigInt(100);
      
      for (let i = 0; i < 20; i++) {
        const mid = (low + high) / BigInt(2);
        const quote = await getBuyQuote(tokenAddress, mid);
        
        if (quote > TARGET * BigInt(990) / BigInt(1000) && 
            quote < TARGET * BigInt(1010) / BigInt(1000)) {
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
      return null;
    } finally {
      setIsCalculatingNft(false);
    }
  };

  const handleTransaction = async () => {
    if (!userAddress) {
      setShowAuthFlow(true);
      return;
    }

    // Check and switch chain if needed
    if (chain && wagmiBase && chain.id !== wagmiBase.id) {
      try {
        await switchChain({ chainId: wagmiBase.id });
        return; // Return here as the chain switch will trigger a re-render
      } catch (err) {
        console.error('Failed to switch chain:', err);
        setError('Failed to switch to Base network. Please switch manually.');
        return;
      }
    }

    try {
      setError('');
      const marketType = tokenState?.marketType || 0;

      if (isBuying) {
        if (!amount) return;

        try {
          const config = {
            address,
            abi: higherrrrrrrAbi,
            functionName: 'buy',
            chainId: wagmiBase.id,
            value: parseEther(amount),
            args: [
              userAddress,
              userAddress,
              '',
              marketType,
              parseEther(MIN_ETH_AMOUNT),
              0
            ]
          };

          console.log('Transaction Config:', {
            ...config,
            value: config.value.toString(),
            userBalance: ethBalance?.value.toString(),
            chain: chain?.id,
            targetChain: wagmiBase.id
          });

          buyToken(config);

        } catch (err) {
          console.error('Buy transaction error:', err);
          if (err.code === 'ACTION_REJECTED') {
            setError('Transaction rejected by user');
          } else if (err.message?.includes('insufficient funds')) {
            setError(`Insufficient balance for transaction. Required: ${err.message.match(/want (\d+)/)?.[1] || 'unknown'}, Have: ${ethBalance?.value.toString() || '0'}`);
          } else {
            setError(err.message || 'Buy transaction failed');
          }
        }
      } else {
        if (!amount) return;

        try {
          const config = {
            address,
            abi: higherrrrrrrAbi,
            functionName: 'sell',
            args: [
              parseEther(amount),
              userAddress,
              '',
              marketType,
              parseEther(MIN_ETH_AMOUNT),
              0
            ]
          };

          sellToken(config);

        } catch (err) {
          console.error('Sell transaction error:', err);
          if (err.code === 'ACTION_REJECTED') {
            setError('Transaction rejected by user');
          } else {
            setError(err.message || 'Sell transaction failed');
          }
        }
      }
    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
    }
  };

  const isQuoteAvailable = useMemo(() => {
    if (!amount || !quote) return false;
    return true;
  }, [amount, quote]);

  // Effect to update quote when amount changes
  useEffect(() => {
    if (!amount || !address) {
      setQuote(null);
      return;
    }

    const updateQuote = async () => {
      const MAX_RETRIES = 5;
      
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const amountWei = parseEther(amount);

          if (isBuying) {
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
            return;
          } else {
            const quoteWei = await getSellQuote(address, amountWei);
            if (quoteWei === BigInt(0)) {
              if (attempt === MAX_RETRIES) {
                setQuote(null);
                setError('Failed to get quote');
                return;
              }
              continue;
            }
            setQuote(quoteWei);
            setError('');
            return;
          }
        } catch (error) {
          if (attempt === MAX_RETRIES) {
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

  // Add effect to handle errors
  useEffect(() => {
    if (isBuyError && buyError) {
      console.error('Buy error:', buyError);
      setError(buyError.message || 'Buy transaction failed');
    }
    if (isSellError && sellError) {
      console.error('Sell error:', sellError);
      setError(sellError.message || 'Sell transaction failed');
    }
  }, [isBuyError, buyError, isSellError, sellError]);

  return (
    <div className="border border-green-500/30 rounded-lg p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              ${(Number(userBalance) * parseFloat(tokenState.currentPrice) * ethPrice).toFixed(2)}
            </div>
          </div>
        </div>

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
          
          <button
            onClick={async () => {
              const ethAmount = await calculateEthForTokenAmount(address, 1_001_001);
              if (ethAmount) {
                setIsBuying(true);
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
                   ? `${formatTokenAmount(formatEther(quote))} ${tokenState.symbol}`
                   : `${parseFloat(formatEther(quote)).toFixed(6)} ETH`
                 ) : '...'}
              </span>
            </div>
            <div className="flex justify-between text-sm text-green-500/70">
              <span>USD Value</span>
              <span>
                {!isQuoteAvailable ? '-' :
                 quote ? `$${(parseFloat(formatEther(quote)) * (isBuying ? parseFloat(tokenState.currentPrice) * ethPrice : ethPrice)).toFixed(2)}` : '...'}
              </span>
            </div>
            
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
          <div className="space-y-4">
            <div className="flex justify-center">
              <DynamicConnectButton 
                className="w-full max-w-[300px] px-6 py-3 border-2 border-green-500/20 rounded hover:border-green-500/40 transition-colors hover:bg-green-500/5 text-green-500 font-mono text-sm inline-flex items-center justify-center"
              />
            </div>
            <div className="text-sm text-center text-green-500/50">
              Connect your wallet to trade
            </div>
          </div>
        ) : (
          <button
            onClick={handleTransaction}
            disabled={
              tokenState.paused || 
              isLoading || 
              !amount ||
              (!isBuying && parseFloat(amount) > parseFloat(userBalance))
            }
            className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded transition-colors relative"
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                <span>{isBuying ? "Buying..." : "Selling..."}</span>
              </div>
            ) : (
              <span>
                {isBuying 
                  ? quote 
                    ? `Buy ~${formatTokenAmount(formatEther(quote))} ${tokenState.symbol}` 
                    : `Buy ${tokenState.symbol}`
                  : `Sell ${formatTokenAmount(amount)} ${tokenState.symbol}`
                }
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  );
} 