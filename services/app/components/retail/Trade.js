'use client';

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import TradeNotification from './TradeNotification';

export default function Trade({ token }) {
  const [showNotification, setShowNotification] = useState(false);
  const [lastTrade, setLastTrade] = useState(null);

  const handleTradeSuccess = (tradeDetails) => {
    // Trigger confetti
    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.65 },
      colors: ['#22c55e', '#16a34a', '#15803d'] // Green shades
    });

    // Haptic feedback - double pulse for trades
    if (window.navigator.vibrate) {
      window.navigator.vibrate([50, 30, 50]);
    }

    // Play trade sound
    const audio = new Audio('/sounds/trade-complete.mp3');
    audio.volume = 0.4;
    audio.play().catch(() => {});

    // Show notification
    setLastTrade(tradeDetails);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleTrade = async (amount, price) => {
    try {
      // Existing trade logic here
      
      handleTradeSuccess({
        amount,
        price,
        symbol: token.symbol
      });
    } catch (error) {
      console.error('Trade failed:', error);
    }
  };

  return (
    <>
      {/* Existing trade UI */}
      
      {showNotification && (
        <TradeNotification 
          trade={lastTrade}
          onClose={() => setShowNotification(false)}
        />
      )}
    </>
  );
} 