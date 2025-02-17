import { useState, useEffect } from 'react';
import { useTrading } from '../hooks/useTrading';
import { GlowBorder } from './GlowBorder';
import { formatNumber } from '../utils/format';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import DynamicConnectButton from './DynamicConnectButton';

export function TradingModal({ token, isOpen, onClose }) {
  const { primaryWallet, isAuthenticated } = useDynamicContext();
  const [inputAmount, setInputAmount] = useState('');
  const [isReversed, setIsReversed] = useState(false); // Track swap direction
  const [outputAmount, setOutputAmount] = useState('');
  const [slippage, setSlippage] = useState(1);
  const {
    quote,
    loading,
    error,
    fetchQuote,
    executeSwap,
    swapStatus,
    solBalance
  } = useTrading(token?.address);

  // Handle swap direction toggle
  const handleSwapDirection = () => {
    setIsReversed(!isReversed);
    setInputAmount(''); // Reset input when switching direction
  };

  // Format functions
  const formatTokenAmount = (amount) => {
    if (!amount) return '0';
    const num = parseFloat(amount);
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(1)}K`;
    return num.toFixed(num < 0.01 ? 6 : 2);
  };

  useEffect(() => {
    if (inputAmount && token) {
      fetchQuote(inputAmount, isReversed);
    }
  }, [inputAmount, token, fetchQuote, isReversed]);

  // Add debug logging
  useEffect(() => {
    console.log('Wallet status:', {
      address: primaryWallet?.address,
      solBalance,
      isAuthenticated
    });
  }, [primaryWallet, solBalance, isAuthenticated]);

  if (!isOpen) return null;

  // Determine which token is input/output based on direction
  const inputToken = isReversed ? token : { symbol: 'SOL', balance: solBalance };
  const outputToken = isReversed ? { symbol: 'SOL', balance: solBalance } : token;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="w-full max-w-md mx-4">
        <GlowBorder intensity={2.5} className="animate-glow-pulse">
          <div className="bg-black/95 p-8 rounded-lg relative overflow-hidden">
            {/* Cyberpunk background effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(22,163,74,0.1),transparent_50%)]" />

            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-3xl font-mono font-bold text-green-500">Swap</h3>
              <button 
                onClick={onClose} 
                className="text-green-500/70 hover:text-green-400 transition-all w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {!primaryWallet ? (
              <div className="space-y-4 py-8">
                <div className="text-center text-green-500/70 font-mono mb-4">
                  Connect your wallet to trade
                </div>
                <div className="flex justify-center">
                  <DynamicConnectButton 
                    className="px-6 py-3 bg-green-500/10 text-green-500 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all font-mono"
                  />
                </div>
              </div>
            ) : (
              <>
                {/* Quick select percentages with cyberpunk style */}
                <div className="flex gap-2 mb-4">
                  {[25, 50, 75, 100].map((value) => (
                    <button
                      key={value}
                      onClick={() => {
                        const balance = isReversed ? token?.balance : solBalance;
                        setInputAmount((parseFloat(balance || 0) * (value / 100)).toFixed(6));
                      }}
                      className="flex-1 px-4 py-2 bg-black border border-green-500/20 rounded-lg text-green-500/70 hover:text-green-400 hover:border-green-500/40 transition-all font-mono hover:bg-green-500/5 relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/5 to-green-500/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      {value}%
                    </button>
                  ))}
                </div>

                {/* Input Token */}
                <div className="bg-black/30 border border-green-500/20 rounded-2xl p-5 mb-2">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-green-500/70 font-mono">You pay</span>
                    <span className="text-green-500/70 font-mono">
                      Balance: {formatTokenAmount(inputToken.balance)} {inputToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={inputAmount}
                      onChange={(e) => setInputAmount(e.target.value)}
                      placeholder="0.0"
                      className="w-full bg-transparent text-4xl text-green-500 placeholder-green-500/20 outline-none font-mono"
                    />
                    <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                      <span className="text-green-500 font-medium font-mono">{inputToken.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center -my-1">
                  <button
                    onClick={handleSwapDirection}
                    className="w-10 h-10 rounded-full border border-green-500/20 flex items-center justify-center bg-black text-green-500/70 hover:text-green-400 hover:border-green-500/40 transition-all"
                  >
                    ↓
                  </button>
                </div>

                {/* Output Token */}
                <div className="bg-black/30 border border-green-500/20 rounded-2xl p-5 mt-2">
                  <div className="flex justify-between mb-2 text-sm">
                    <span className="text-green-500/70 font-mono">You receive</span>
                    <span className="text-green-500/70 font-mono">
                      Balance: {formatTokenAmount(outputToken.balance)} {outputToken.symbol}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <input
                      type="number"
                      value={quote?.outAmount || ''}
                      readOnly
                      placeholder="0.0"
                      className="w-full bg-transparent text-4xl text-green-500 placeholder-green-500/20 outline-none font-mono"
                    />
                    <div className="flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                      <span className="text-green-500 font-medium font-mono">{outputToken.symbol}</span>
                    </div>
                  </div>
                </div>

                {/* Slippage Settings */}
                <div className="bg-black/30 border border-green-500/20 rounded-2xl p-5 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-500/70 font-mono">Slippage Tolerance</span>
                    <div className="flex gap-2">
                      {[0.5, 1, 2].map((value) => (
                        <button
                          key={value}
                          onClick={() => setSlippage(value)}
                          className={`px-4 py-2 rounded-xl text-sm font-mono ${
                            value === 1
                              ? 'bg-green-500/20 text-green-500 border border-green-500/40'
                              : 'border border-green-500/20 text-green-500/70 hover:border-green-500/40'
                          }`}
                        >
                          {value}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Error Display */}
                {error && (
                  <div className="mt-4 text-red-500/90 text-sm px-4 py-2 bg-red-500/10 rounded-xl font-mono border border-red-500/20">
                    {error}
                  </div>
                )}

                {/* Swap Button with GlowBorder */}
                <div className="mt-6">
                  <GlowBorder intensity={2} className="group">
                    <button
                      onClick={() => executeSwap(inputAmount, isReversed)}
                      disabled={loading || !quote || swapStatus.loading || !isAuthenticated}
                      className="w-full py-4 bg-black text-green-500 rounded-xl border border-green-500/20 hover:border-green-500/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold text-xl font-mono relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/0 via-green-500/10 to-green-500/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                      <span className="relative z-10">
                        {swapStatus.loading ? 'Swapping...' : 'Swap'}
                      </span>
                    </button>
                  </GlowBorder>
                </div>
              </>
            )}
          </div>
        </GlowBorder>
      </div>
    </div>
  );
} 