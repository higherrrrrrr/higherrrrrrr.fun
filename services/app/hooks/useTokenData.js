import { useState, useEffect } from 'react';

export function useTokenData(address, userAddress) {
  const [tokenState, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState('0');
  const [isCreator, setIsCreator] = useState(false);

  const fetchTokenData = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/token/${address}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch token data');
      }
      
      setTokenState(data);
      setIsCreator(userAddress?.toLowerCase() === data.creator?.toLowerCase());
      
      // Update user balance if wallet is connected
      if (userAddress) {
        const balanceResponse = await fetch(`/api/${address}/balance/${userAddress}`);
        const balanceData = await balanceResponse.json();
        
        if (!balanceResponse.ok) {
          throw new Error(balanceData.error || 'Failed to fetch balance');
        }
        
        setUserBalance(balanceData.balance);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchTokenData();
    
    // Set up refresh interval
    const refreshInterval = setInterval(fetchTokenData, 15000);
    return () => clearInterval(refreshInterval);
  }, [address, userAddress]);

  // Update balance when wallet changes
  useEffect(() => {
    const updateBalance = async () => {
      if (userAddress && address) {
        try {
          const balanceResponse = await fetch(`/api/${address}/balance/${userAddress}`);
          const balanceData = await balanceResponse.json();
          
          if (!balanceResponse.ok) {
            throw new Error(balanceData.error || 'Failed to fetch balance');
          }
          
          setUserBalance(balanceData.balance);
        } catch (error) {
          console.error('Error updating balance:', error);
          setUserBalance('0');
        }
      } else {
        setUserBalance('0');
      }
    };

    updateBalance();
  }, [userAddress, address]);

  return {
    tokenState,
    loading,
    userBalance,
    tokenDetails: tokenState?.details,
    isCreator,
    refreshTokenState: fetchTokenData
  };
} 