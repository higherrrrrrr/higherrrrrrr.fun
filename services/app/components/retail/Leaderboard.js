'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '../../hooks/useWallet';
import confetti from 'canvas-confetti';

const GlowBorder = dynamic(() => import('../GlowBorder'), { ssr: false });
const RankNotification = dynamic(() => import('./RankNotification'), { ssr: false });

const TIME_FRAMES = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: 'all', label: 'All Time' }
];

const BOARD_TYPES = [
  { value: 'volume', label: 'Volume' },
  { value: 'trades', label: 'Trades' },
  { value: 'achievements', label: 'Achievements' }
];

export default function Leaderboard({ onUserRankChange }) {
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState('7d');
  const [type, setType] = useState('volume');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showRankNotification, setShowRankNotification] = useState(false);
  const prevRank = useRef(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `/api/achievements/leaderboard?timeframe=${timeframe}&type=${type}`
      );
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [timeframe, type]);

  useEffect(() => {
    const userEntry = data.find(entry => entry.wallet_address === publicKey?.toBase58());
    if (userEntry) {
      const currentRank = data.indexOf(userEntry) + 1;
      if (prevRank.current && currentRank < prevRank.current) {
        // Rank improved!
        setShowRankNotification(true);
        confetti({
          particleCount: 50,
          spread: 45,
          origin: { y: 0.7 }
        });
        
        // Haptic feedback
        if (window.navigator.vibrate) {
          window.navigator.vibrate([100, 50, 100]);
        }

        setTimeout(() => setShowRankNotification(false), 5000);
      }
      prevRank.current = currentRank;
    }
  }, [data, publicKey]);

  const formatValue = (value, type) => {
    if (type === 'volume') {
      return `$${Number(value).toLocaleString()}`;
    }
    return Number(value).toLocaleString();
  };

  if (error) return (
    <GlowBorder className="p-4">
      <div className="text-red-500">Error loading leaderboard: {error}</div>
    </GlowBorder>
  );

  return (
    <GlowBorder className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl">Leaderboard</h2>
        <div className="flex gap-2">
          <select 
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="bg-black/20 border border-white/10 rounded px-2 py-1"
          >
            {TIME_FRAMES.map(tf => (
              <option key={tf.value} value={tf.value}>{tf.label}</option>
            ))}
          </select>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-black/20 border border-white/10 rounded px-2 py-1"
          >
            {BOARD_TYPES.map(bt => (
              <option key={bt.value} value={bt.value}>{bt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, index) => (
            <div 
              key={entry.wallet_address}
              className={`
                flex items-center justify-between p-3 rounded
                ${entry.wallet_address === publicKey?.toBase58() 
                  ? 'bg-green-500/20 border border-green-500/30' 
                  : 'bg-white/5 hover:bg-white/10'}
                transition-colors duration-200
              `}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl font-bold text-white/50">
                  #{index + 1}
                </span>
                <div>
                  <div className="font-mono">
                    {entry.wallet_address.slice(0, 4)}...
                    {entry.wallet_address.slice(-4)}
                  </div>
                  <div className="text-sm text-white/50">
                    {entry.tokens_traded} tokens traded
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold">
                  {type === 'achievements' ? (
                    <div className="flex items-center gap-1">
                      {entry.achievement_count}
                      <span className="text-sm ml-1">
                        {entry.achievement_icons?.join(' ')}
                      </span>
                    </div>
                  ) : (
                    formatValue(
                      type === 'volume' ? entry.total_volume : entry.total_trades,
                      type
                    )
                  )}
                </div>
                <div className="text-sm text-white/50">
                  Last active: {new Date(entry.last_trade || entry.last_achievement).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showRankNotification && (
        <RankNotification 
          rank={prevRank.current}
          type={type}
          timeframe={timeframe}
        />
      )}
    </GlowBorder>
  );
} 