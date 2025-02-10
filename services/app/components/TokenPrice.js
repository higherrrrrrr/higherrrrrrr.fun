'use client';
import { useState, useEffect } from 'react';

export default function TokenPrice({ price, priceChange, timeframe }) {
  const [flash, setFlash] = useState('');
  const [prevPrice, setPrevPrice] = useState(price);

  useEffect(() => {
    if (price !== prevPrice) {
      setFlash(price > prevPrice ? 'flash-green' : 'flash-red');
      setPrevPrice(price);
      const timer = setTimeout(() => setFlash(''), 1000);
      return () => clearTimeout(timer);
    }
  }, [price, prevPrice]);

  return (
    <div className={`transition-colors duration-300 ${flash}`}>
      <div>${price < 0.01 ? price.toExponential(2) : price.toFixed(2)}</div>
      <div className={priceChange >= 0 ? 'text-green-400' : 'text-red-400'}>
        {priceChange >= 0 ? '+' : ''}{priceChange?.toFixed(2)}%
      </div>
    </div>
  );
} 