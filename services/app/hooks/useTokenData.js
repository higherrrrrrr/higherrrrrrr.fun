import { useState, useEffect } from 'react';
import { getTokenState, getTokenBalance } from '../onchain';
import { getEthPrice } from '../api/price';
import { getTokenCreator, getToken } from '../api/token';

export function useTokenData(address, userAddress) {
  const [tokenState, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ethPrice, setEthPrice] = useState(0);
  const [userBalance, setUserBalance] = useState('0');
  const [tokenDetails, setTokenDetails] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  async function refreshTokenState() {
    if (typeof address === 'string') {
      const state = await getTokenState(address);
      setTokenState(state);
      
      if (userAddress) {
        const balance = await getTokenBalance(address, userAddress);
        setUserBalance(balance);
      }
    }
  }

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
    
    const balanceInterval = setInterval(updateBalance, 15000);
    return () => clearInterval(balanceInterval);
  }, [userAddress, address]);

  useEffect(() => {
    const checkCreator = async () => {
      if (userAddress) {
        try {
          const creatorData = await getTokenCreator(address);
          setIsCreator(
            creatorData.creator.toLowerCase() === userAddress.toLowerCase()
          );
        } catch (error) {
          setIsCreator(false);
        } 
      }
    };
    checkCreator();
  }, [address, userAddress]);

  useEffect(() => {
    const fetchTokenDetails = async () => {
      if (!address) return;
      try {
        const details = await getToken(address);
        setTokenDetails(details);
      } catch (error) {
        // Silently fail
      }
    };
    fetchTokenDetails();
  }, [address]);

  useEffect(() => {
    if (address) {
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

      const tokenRefreshTimer = setInterval(() => {
        refreshTokenState().catch(console.error);
      }, 15000);

      return () => clearInterval(tokenRefreshTimer);
    }
  }, [address]);

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

  return {
    tokenState,
    loading,
    ethPrice,
    userBalance,
    tokenDetails,
    isCreator,
    refreshTokenState
  };
} 