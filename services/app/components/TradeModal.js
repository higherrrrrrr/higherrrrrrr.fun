import { useState, useEffect } from 'react';
import { GlowBorder } from './GlowBorder';
import DynamicConnectButton from './DynamicConnectButton';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { TransactionStatusModal } from './TransactionStatusModal';

export function TradeModal({ isOpen, onClose, token, userBalance = 0, onBalanceUpdate }) {
  const [amount, setAmount] = useState('');
  const [isSelling, setIsSelling] = useState(true);
  const [selectedToken, setSelectedToken] = useState('SOL');
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [txStatus, setTxStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  
  const { primaryWallet, isAuthenticated } = useDynamicContext();

  useEffect(() => {
    let progressInterval;
    
    if (txStatus === 'signing') {
      setProgress(0);
      progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 1, 90));
      }, 100);
    } else if (txStatus === 'processing') {
      setProgress(90);
      progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 0.5, 99));
      }, 200);
    } else if (txStatus === 'success') {
      setProgress(100);
    }

    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [txStatus]);

  const handleSwap = async () => {
    try {
      setTxStatus('signing');
      
      // Example transaction (replace with actual swap logic)
      const transaction = {
        from: primaryWallet?.address,
        to: token.token_address,
        amount: amount,
        token: selectedToken
      };

      // Wait for signature
      await primaryWallet?.connector?.sendTransaction(transaction);
      
      setTxStatus('processing');
      
      // Simulate transaction confirmation (replace with actual confirmation logic)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTxStatus('success');
      
      // Update balances
      if (onBalanceUpdate) {
        await onBalanceUpdate();
      }
      
      // Close modals after success
      setTimeout(() => {
        setTxStatus(null);
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Swap failed:', error);
      setTxStatus(null);
    }
  };

  if (!isOpen) return null;

  const tokens = [
    { symbol: 'SOL', balance: userBalance, icon: '◎' },
    { symbol: 'USDC', balance: userBalance * 20.5, icon: '$' }
  ];

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="w-full max-w-[380px]">
          <GlowBorder className="overflow-hidden rounded-2xl">
            <div className="bg-black p-4 rounded-2xl">
              {/* Header with Trade Type Toggle */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <button
                      onClick={() => setIsSelling(true)}
                      className={`text-lg font-bold transition-colors ${
                        isSelling ? 'text-green-500' : 'text-green-500/40 hover:text-green-500/60'
                      }`}
                    >
                      Selling
                    </button>
                    <button
                      onClick={() => setIsSelling(false)}
                      className={`text-lg font-bold transition-colors ${
                        !isSelling ? 'text-green-500' : 'text-green-500/40 hover:text-green-500/60'
                      }`}
                    >
                      Buying
                    </button>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-green-500/70 hover:text-green-500 transition-colors p-2"
                  >
                    ✕
                  </button>
                </div>

                {/* Trade Type Pills */}
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 bg-green-500 text-black rounded-full text-sm font-medium">
                    Instant
                  </button>
                  <button className="px-3 py-1.5 text-green-500/50 hover:text-green-500 
                                   hover:bg-green-500/10 rounded-full text-sm font-medium transition-colors">
                    Limit
                  </button>
                  <button className="px-3 py-1.5 text-green-500/50 hover:text-green-500 
                                   hover:bg-green-500/10 rounded-full text-sm font-medium transition-colors">
                    DCA
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mt-6 p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow">
                    <input
                      type="text"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-4xl bg-transparent text-green-500 outline-none font-mono w-full"
                      placeholder="0"
                    />
                    <div className="text-sm text-green-500/50 mt-1">
                      ≈ ${amount ? (parseFloat(amount) * 20.5).toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <button 
                    className="px-3 py-1.5 bg-green-500/10 text-green-500 
                             rounded-lg text-sm hover:bg-green-500/20 transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Token Selection */}
              <div className="mt-3 space-y-3">
                {/* From/Sell Token */}
                <div className="relative">
                  <button
                    onClick={() => setShowTokenSelect(!showTokenSelect)}
                    className="w-full flex items-center justify-between p-4 
                             rounded-xl bg-green-500/5 border border-green-500/20 
                             hover:border-green-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                        {tokens.find(t => t.symbol === selectedToken)?.icon}
                      </div>
                      <div className="text-green-500 font-medium">{selectedToken}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-green-500">{userBalance.toFixed(4)}</div>
                        <div className="text-sm text-green-500/50">Available</div>
                      </div>
                      <span className="text-green-500/50">▼</span>
                    </div>
                  </button>

                  {showTokenSelect && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-black/95 
                                  border border-green-500/20 rounded-xl overflow-hidden z-10
                                  backdrop-blur-sm shadow-xl">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedToken(token.symbol);
                            setShowTokenSelect(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 hover:bg-green-500/10
                                   transition-colors"
                        >
                          <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                            {token.icon}
                          </div>
                          <span className="text-green-500">{token.symbol}</span>
                          <span className="text-green-500/50 text-sm ml-auto">
                            {token.balance.toFixed(4)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Swap Direction Button */}
                <div className="flex justify-center -my-1.5 z-10">
                  <button 
                    onClick={() => setIsSelling(!isSelling)}
                    className="w-8 h-8 rounded-full border border-green-500/30 
                             flex items-center justify-center text-green-500 
                             hover:bg-green-500/10 transition-colors bg-black"
                  >
                    ↓
                  </button>
                </div>

                {/* To Token */}
                <div className="w-full flex items-center justify-between p-4 
                              rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                      {token.symbol.charAt(0)}
                    </div>
                    <div className="text-green-500 font-medium">{token.symbol}</div>
                  </div>
                  {amount && (
                    <div className="text-right">
                      <div className="text-green-500">≈ {(parseFloat(amount) * 2.5).toFixed(4)}</div>
                      <div className="text-sm text-green-500/50">You receive</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Route Optimization */}
              <div className="mt-4 flex items-center gap-2 px-2">
                <div className="h-5 w-5 text-green-500">⚡</div>
                <div className="text-sm text-green-500/70">Best route: Jupiter Aggregator</div>
              </div>

              {/* Action Button */}
              <div className="mt-4">
                {!isAuthenticated ? (
                  <DynamicConnectButton 
                    className="w-full p-3 text-center bg-transparent text-green-500 
                             hover:bg-green-500/10 transition-colors flex items-center 
                             justify-center gap-2 font-medium border border-green-500/20 
                             rounded-xl"
                  />
                ) : (
                  <GlowBorder className="rounded-xl overflow-hidden">
                    <button 
                      className="w-full p-3 text-center bg-transparent text-green-500 
                               hover:bg-green-500/10 transition-colors flex items-center 
                               justify-center gap-2 font-medium disabled:opacity-50
                               disabled:cursor-not-allowed"
                      disabled={!amount || txStatus}
                      onClick={handleSwap}
                    >
                      {!amount ? 'Enter an amount' : 'Swap'}
                    </button>
                  </GlowBorder>
                )}
              </div>

              {/* Optional: Add transaction status message */}
              {txStatus === 'signing' && (
                <div className="mt-2 text-center text-sm text-green-500/70">
                  Please confirm the transaction in your wallet
                </div>
              )}
            </div>
          </GlowBorder>
        </div>
      </div>

      {/* Transaction Status Modal */}
      {txStatus && (
        <TransactionStatusModal 
          status={txStatus}
          progress={progress}
        />
      )}
    </>
  );
} 