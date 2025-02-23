'use client';

import React from 'react';

export default function RankNotification({ rank, type, timeframe }) {
  return (
    <div className="fixed bottom-4 right-4 bg-green-500/90 text-white p-4 rounded-lg shadow-lg notification-slide">
      <div className="font-bold">New Rank Achievement! 🏆</div>
      <div>
        You're now #{rank} in {type}
        {timeframe !== 'all' ? ` (${timeframe})` : ''}
      </div>
    </div>
  );
} 