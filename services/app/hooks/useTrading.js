import { useState, useCallback, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export function useTrading(tokenAddress) {
  const { primaryWallet, isAuthenticated } = useDynamicContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quote, setQuote] = useState(null);
  const [swapStatus, setSwapStatus] = useState({ loading: false, error: null });
  const [solBalance, setSolBalance] = useState('0');

  const fetchQuote = useCallback(async (inputAmount, isReversed) => {
    if (!tokenAddress || !inputAmount) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/token/${tokenAddress}/quote?amount=${inputAmount}&reverse=${isReversed}`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || 'Failed to fetch quote');
      
      setQuote(data);
    } catch (err) {
      setError(err.message);
      setQuote(null);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  const executeSwap = useCallback(async (inputAmount, isReversed) => {
    if (!primaryWallet?.address || !tokenAddress || !inputAmount) return;
    
    setSwapStatus({ loading: true, error: null });
    
    try {
      const response = await fetch(`/api/token/${tokenAddress}/swap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          inputAmount,
          isReversed,
          walletAddress: primaryWallet.address
        })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Swap failed');
      
      // Use Dynamic's signAndSendTransaction instead of separate signing
      const txHash = await primaryWallet.signAndSendTransaction({
        transaction: data.transaction
      });
      
      if (!txHash) throw new Error('Failed to send transaction');
      
      setSwapStatus({ loading: false, error: null });
      return txHash;
      
    } catch (err) {
      setSwapStatus({ loading: false, error: err.message });
      throw err;
    }
  }, [primaryWallet, tokenAddress]);

  useEffect(() => {
    if (!primaryWallet?.address) return;

    const fetchBalance = async () => {
      try {
        const response = await fetch(`/api/wallet/${primaryWallet.address}/solana/balance`);
        if (!response.ok) throw new Error('Failed to fetch balance');
        
        const data = await response.json();
        setSolBalance(data.balance);
      } catch (err) {
        console.error('Failed to fetch SOL balance:', err);
        setSolBalance('0');
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [primaryWallet]);

  return {
    quote,
    loading,
    error,
    fetchQuote,
    executeSwap,
    swapStatus,
    solBalance
  };
} 