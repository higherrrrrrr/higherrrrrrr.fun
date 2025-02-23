'use client';

import React from 'react';
import { useSpring, animated } from '@react-spring/web';

export default function TradeNotification({ trade, onClose }) {
  const props = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { tension: 300, friction: 20 }
  });

  return (
    <animated.div 
      style={props}
      className="fixed bottom-4 right-4 bg-green-500/90 text-white p-4 rounded-lg shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">💫</div>
        <div>
          <div className="font-bold">Trade Complete!</div>
          <div className="text-sm">
            {trade.amount} {trade.symbol} @ ${trade.price}
          </div>
        </div>
      </div>
    </animated.div>
  );
} 