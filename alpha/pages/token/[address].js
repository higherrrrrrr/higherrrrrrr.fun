import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getTokenState, getProgressToNextLevel } from '../../onchain';
import { useContractWrite, useWaitForTransaction, useContractRead } from 'wagmi';
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
  const [amountUsd, setAmountUsd] = useState('');
  const [isBuying, setIsBuying] = useState(true);
  const [priceUnit, setPriceUnit] = useState('TOKEN');
  const [latestTokens, setLatestTokens] = useState([]);

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

  useEffect(() => {
    if (address) {
      setLoading(true);
      Promise.all([
        refreshTokenState(),
        getEthPrice()
      ])
        .then(([_, priceData]) => {
          console.log('Token state loaded:', tokenState);
          console.log('Current name:', tokenState?.currentName);
          console.log('ETH Price:', priceData.price_usd);
          setEthPrice(priceData.price_usd);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
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

  // Add quote contract reads
  const { data: buyQuote } = useContractRead({
    address: address,
    abi: higherrrrrrrAbi,
    functionName: 'getTokenBuyQuote',
    args: [parseEther(
      amount && 
      !isNaN(amount) && 
      isFinite(parseFloat(amount)) ? 
      amount : 
      '0'
    )],
    watch: true,
  });

  const { data: sellQuote } = useContractRead({
    address: address,
    abi: higherrrrrrrAbi,
    functionName: 'getTokenSellQuote',
    args: [parseEther(
      amount && 
      !isNaN(amount) && 
      isFinite(parseFloat(amount)) ? 
      amount : 
      '0'
    )],
    watch: true,
  });

  const handleAmountChange = (value) => {
    // Validate input is a valid number
    if (value === '' || 
        isNaN(value) || 
        !isFinite(parseFloat(value)) || 
        parseFloat(value) < 0) {
      setAmount('');
      setAmountUsd('');
      return;
    }

    // Limit decimal places to 18
    const formattedValue = parseFloat(value).toFixed(18);

    if (priceUnit === 'TOKEN') {
      setAmount(formattedValue);
      // Convert tokens to USD using quote
      const quote = isBuying ? buyQuote : sellQuote;
      if (quote) {
        const ethAmount = formatEther(quote);
        const usdAmount = parseFloat(ethAmount) * ethPrice;
        setAmountUsd(usdAmount.toFixed(6));
      }
    } else {
      setAmountUsd(formattedValue);
      // Convert USD to tokens
      const ethAmount = parseFloat(value) / ethPrice;
      if (isBuying) {
        // For buying, we need to estimate tokens received for ETH
        const tokenAmount = ethAmount / parseFloat(tokenState.currentPrice);
        setAmount(tokenAmount.toFixed(18));
      } else {
        // For selling, we need to estimate ETH received for tokens
        const tokenAmount = ethAmount / parseFloat(tokenState.currentPrice);
        setAmount(tokenAmount.toFixed(18));
      }
    }
  };

  const handleTransaction = () => {
    if (isBuying) {
      const quote = buyQuote;
      if (!quote) return;
      
      buyToken({
        value: quote,
        args: [
          "0x0000000000000000000000000000000000000000", // recipient (self)
          "0x0000000000000000000000000000000000000000", // refund recipient (self)
          "", // comment
          0, // expected market type
          0, // min order size
          0n // sqrt price limit
        ]
      });
    } else {
      sellToken({
        args: [
          parseEther(amount), // tokens to sell
          "0x0000000000000000000000000000000000000000", // recipient (self)
          "", // comment
          0, // expected market type
          0, // min payout size
          0n // sqrt price limit
        ]
      });
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

  const usdPrice = parseFloat(tokenState.currentPrice) * ethPrice;
  const marketCap = usdPrice * parseFloat(tokenState.totalSupply);
  const progress = getProgressToNextLevel(tokenState);
  const isBondingCurve = parseFloat(tokenState.totalSupply) < 800000000;

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono">
      {/* Ticker Bar */}
      <div className="border-b border-green-500/30 p-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold">{tokenState.symbol}</div>
          <div className="flex space-x-8">
            <div>
              <div className="text-sm text-green-500/50">Price</div>
              <div>${usdPrice.toFixed(6)}</div>
            </div>
            <div>
              <div className="text-sm text-green-500/50">Market Cap</div>
              <div>${marketCap.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-green-500/50">Supply</div>
              <div>{parseFloat(tokenState.totalSupply).toLocaleString()}</div>
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
            Level {tokenState.currentLevel} of {tokenState.priceLevels.length}
          </div>
        </div>

        {/* Progress Bar (if on bonding curve) */}
        {isBondingCurve && (
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
            <span>{progress.toFixed(2)}%</span>
          </div>
          <div className="w-full bg-green-500/20 rounded-full h-4">
            <div 
              className="bg-green-500 h-4 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Levels Table */}
        <div className="border border-green-500/30 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-green-500/30">
                <th className="p-4 text-left">Level</th>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-right">Price (ETH)</th>
                <th className="p-4 text-right">Price (USD)</th>
                <th className="p-4 text-right">Market Cap</th>
                <th className="p-4 text-center">State</th>
              </tr>
            </thead>
            <tbody>
              {tokenState.priceLevels.map((level, index) => {
                const isCurrentLevel = index === tokenState.currentLevel;
                const isPastLevel = index < tokenState.currentLevel;
                const isFutureLevel = index > tokenState.currentLevel;
                const levelUsdPrice = parseFloat(level.price) * ethPrice;
                const levelMarketCap = levelUsdPrice * MAX_SUPPLY;

                return (
                  <tr 
                    key={index}
                    className={`
                      border-b border-green-500/10 
                      ${isCurrentLevel ? 'bg-green-500/10' : ''}
                      ${isPastLevel ? 'opacity-50' : ''}
                    `}
                  >
                    <td className="p-4">{index + 1}</td>
                    <td className="p-4">{level.name}</td>
                    <td className="p-4 text-right">{level.price}</td>
                    <td className="p-4 text-right">
                      ${levelUsdPrice.toFixed(6)}
                    </td>
                    <td className="p-4 text-right">
                      ${levelMarketCap.toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      {isPastLevel && (
                        <span className="text-green-500/50">Achieved</span>
                      )}
                      {isCurrentLevel && (
                        <span className="text-green-500">Current</span>
                      )}
                      {isFutureLevel && (
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

      {/* Buy/Sell Section */}
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        {/* Trading Interface */}
        <div className="border border-green-500/30 rounded-lg p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Trade Token</h2>
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
              <label className="text-sm text-green-500/70">Amount</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPriceUnit('TOKEN')}
                  className={`px-3 py-1 text-sm rounded ${
                    priceUnit === 'TOKEN' 
                      ? 'bg-green-500 text-black' 
                      : 'border border-green-500 text-green-500'
                  }`}
                >
                  Tokens
                </button>
                <button
                  onClick={() => setPriceUnit('USD')}
                  className={`px-3 py-1 text-sm rounded ${
                    priceUnit === 'USD' 
                      ? 'bg-green-500 text-black' 
                      : 'border border-green-500 text-green-500'
                  }`}
                >
                  USD
                </button>
              </div>
            </div>

            <input
              type="number"
              value={priceUnit === 'TOKEN' ? amount : amountUsd}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full bg-black border border-green-500/30 text-green-500 p-2 rounded focus:border-green-500 focus:outline-none"
              placeholder={`Enter amount in ${priceUnit === 'TOKEN' ? 'tokens' : 'USD'}...`}
            />

            <div className="flex justify-between text-sm">
              <span>Current Price</span>
              <span>{tokenState.currentPrice} ETH (${(parseFloat(tokenState.currentPrice) * ethPrice).toFixed(6)})</span>
            </div>

            <div className="flex justify-between text-sm">
              <span>{isBuying ? "You'll Pay" : "You'll Receive"}</span>
              <span>
                {isBuying 
                  ? buyQuote 
                    ? `${formatEther(buyQuote)} ETH ($${(parseFloat(formatEther(buyQuote)) * ethPrice).toFixed(2)})`
                    : '...'
                  : sellQuote
                    ? `${formatEther(sellQuote)} ETH ($${(parseFloat(formatEther(sellQuote)) * ethPrice).toFixed(2)})`
                    : '...'
                }
              </span>
            </div>

            <button
              onClick={handleTransaction}
              disabled={tokenState.paused || isLoading || !amount || (isBuying ? !buyQuote : !sellQuote)}
              className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-bold rounded transition-colors"
            >
              {isLoading 
                ? (isBuying ? "Buying..." : "Selling...") 
                : (isBuying 
                    ? `Buy ${amount || '0'} Tokens for ${buyQuote ? formatEther(buyQuote) : '...'} ETH` 
                    : `Sell ${amount || '0'} Tokens for ${sellQuote ? formatEther(sellQuote) : '...'} ETH`
                  )
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 