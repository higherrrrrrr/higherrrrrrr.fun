'use client';

import { useState, useMemo, useEffect } from 'react';
import { useAccount, useBalance, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useSignTypedData } from 'wagmi';
import { parseEther, formatEther, concat, numberToHex, size } from 'viem';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import DynamicConnectButton from './DynamicConnectButton';
import { base as wagmiBase } from 'wagmi/chains';
import { formatUsdPrice } from '../utils/format';
import qs from 'qs';

const MIN_ETH_AMOUNT = "0.0000001";
const AFFILIATE_FEE = 100; // 1% fee in basis points
const FEE_RECIPIENT = "YOUR_FEE_RECIPIENT_ADDRESS"; // Replace with your fee recipient address

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
  address: tokenAddress, 
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
    writeContract,
    data: buyHash,
    isPending: isBuyPending,
    error: buyError,
    isError: isBuyError
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

  const isLoading = isBuyLoading || isBuyPending;

  useEffect(() => {
    if (chain && wagmiBase && chain.id !== wagmiBase.id) {
      setError('Please switch to Base network');
    } else {
      setError('');
    }
  }, [chain]);

  const { switchChain } = useSwitchChain();

  const { signTypedDataAsync } = useSignTypedData();

  // New state for 0x API quotes
  const [quoteData, setQuoteData] = useState(null);
  const [permitSignature, setPermitSignature] = useState(null);

  // Function to get quote from 0x API
  const fetchQuote = async (isBuyOrder = true) => {
    if (!amount || !userAddress) return;

    const params = {
      sellToken: isBuyOrder ? 'ETH' : tokenAddress,
      buyToken: isBuyOrder ? tokenAddress : 'ETH',
      sellAmount: parseEther(amount).toString(),
      takerAddress: userAddress,
      swapFeeRecipient: FEE_RECIPIENT,
      swapFeeBps: AFFILIATE_FEE,
      swapFeeToken: isBuyOrder ? tokenAddress : 'ETH',
    };

    try {
      const response = await fetch(`/api/quote?${qs.stringify(params)}`);
      const data = await response.json();
      setQuoteData(data);
      setError('');
      return data;
    } catch (err) {
      console.error('Quote error:', err);
      setError('Failed to get quote');
      return null;
    }
  };

  // Effect to fetch quote when amount changes
  useEffect(() => {
    if (amount) {
      fetchQuote(isBuying);
    }
  }, [amount, isBuying, userAddress, tokenAddress]);

  // Modified transaction handling
  const handleTransaction = async () => {
    if (!userAddress) {
      setShowAuthFlow(true);
      return;
    }

    if (chain && wagmiBase && chain.id !== wagmiBase.id) {
      try {
        await switchChain({ chainId: wagmiBase.id });
        return;
      } catch (err) {
        setError('Failed to switch to Base network');
        return;
      }
    }

    try {
      setError('');
      
      // Get fresh quote
      const quote = await fetchQuote(isBuying);
      if (!quote) return;

      // Sign permit if needed
      if (quote.permit2?.eip712) {
        try {
          const signature = await signTypedDataAsync(quote.permit2.eip712);
          setPermitSignature(signature);
          
          // Append signature to transaction data
          const signatureLengthInHex = numberToHex(size(signature), {
            size: 32,
            signed: false,
          });
          
          quote.transaction.data = concat([
            quote.transaction.data,
            signatureLengthInHex,
            signature
          ]);
          
        } catch (err) {
          console.error('Permit signing error:', err);
          setError('Failed to sign permit');
          return;
        }
      }

      // Send transaction
      const tx = {
        address: quote.to,
        abi: [], // 0x API provides complete transaction data
        functionName: undefined,
        chainId: wagmiBase.id,
        value: quote.value ? BigInt(quote.value) : 0n,
        data: quote.data,
        gas: quote.gas ? BigInt(quote.gas) : undefined
      };

      const hash = await writeContract(tx);
      
      // Wait for transaction receipt
      const receipt = await waitForTransactionReceipt({ hash });
      
      if (receipt.status === 'success') {
        onTradeComplete?.();
        setAmount('');
        setQuoteData(null);
        setError('');
      }

    } catch (err) {
      console.error('Transaction error:', err);
      setError(err.message || 'Transaction failed');
    }
  };

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

  const isQuoteAvailable = useMemo(() => {
    if (!amount || !quote) return false;
    return true;
  }, [amount, quote]);

  // Add effect to handle errors
  useEffect(() => {
    if (isBuyError && buyError) {
      console.error('Buy error:', buyError);
      setError(buyError.message || 'Buy transaction failed');
    }
  }, [isBuyError, buyError]);

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
              const ethAmount = await calculateEthForTokenAmount(tokenAddress, 1_001_001);
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

        {amount && quoteData && (
          <div className="space-y-2 p-4 bg-green-500/5 rounded-lg">
            <div className="flex justify-between text-sm">
              <span>{isBuying ? "You'll Get" : "You'll Receive"}</span>
              <span>
                {isBuying 
                  ? `${formatTokenAmount(formatEther(quoteData.buyAmount))} ${tokenState.symbol}`
                  : `${parseFloat(formatEther(quoteData.buyAmount)).toFixed(6)} ETH`
                }
              </span>
            </div>
            
            {/* Display fees */}
            {quoteData.fees?.integratorFee && (
              <div className="flex justify-between text-sm text-green-500/70">
                <span>Fee</span>
                <span>
                  {formatEther(quoteData.fees.integratorFee.amount)} 
                  {quoteData.fees.integratorFee.token === 'ETH' ? 'ETH' : tokenState.symbol}
                </span>
              </div>
            )}
            
            {/* ... rest of the quote display ... */}
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
                  ? quoteData 
                    ? `Buy ~${formatTokenAmount(formatEther(quoteData.buyAmount))} ${tokenState.symbol}` 
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