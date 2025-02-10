import { useState, useEffect } from 'react';
import { 
  getTopTradingTokens, 
  getLatestTokens,
  getTokenState,
  // ... same functions
} from '@/lib/client-api';
import { getEthPrice } from '../api/price';
import { getTokenCreator, getToken } from '../api/token';
import { getTokenState as getTokenStateFromLib } from '../lib/api';

export function useTokenData(address, userAddress) {
  const [tokenState, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ethPrice, setEthPrice] = useState(0);
  const [userBalance, setUserBalance] = useState('0');
  const [tokenDetails, setTokenDetails] = useState(null);
  const [isCreator, setIsCreator] = useState(false);

  const refreshTokenState = async () => {
    if (!address) return;
    try {
      const state = await getTokenStateFromLib(address);
      setTokenState(state);
      
      if (userAddress) {
        const balance = await getTokenBalance(address, userAddress);
        setUserBalance(balance);
      }
    } catch (error) {
      console.error('Failed to fetch token state:', error);
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (!address || !userAddress) return;
      try {
        const balance = await getTokenBalance(address, userAddress);
        setUserBalance(balance);
      } catch (error) {
        console.error('Failed to fetch balance:', error);
        setUserBalance('0');
      }
    };
    fetchBalance();
  }, [address, userAddress]);

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