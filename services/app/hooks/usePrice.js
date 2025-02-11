// write a use price hook

import { useState, useEffect } from 'react';

export function usePrice(symbol = 'ETH') {
  const [price, setPrice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPrice = async () => {
    if (symbol !== 'ETH') {
      setError('Only ETH is supported currently');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/price/eth');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch price');
      }
      
      setPrice(data.price_usd);
      setError(null);
    } catch (err) {
      console.error('Error fetching price:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    
    // Refresh price every minute
    const refreshInterval = setInterval(fetchPrice, 60000);
    return () => clearInterval(refreshInterval);
  }, [symbol]);

  return {
    price,
    loading,
    error,
    refreshPrice: fetchPrice
  };
}

