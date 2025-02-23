'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWallet } from '../../hooks/useWallet';

const GlowBorder = dynamic(() => import('../GlowBorder'), { ssr: false });

export default function UserStats({ userRank }) {
  const { publicKey, toBase58 } = useWallet();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!publicKey) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/achievements/stats?wallet=${toBase58()}`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [publicKey, toBase58]);

  if (!publicKey) return null;
  if (loading) return <div className="animate-pulse">Loading stats...</div>;
  if (error) return <div className="text-red-500">Error loading stats: {error}</div>;
  if (!stats) return null;

  return (
    <GlowBorder className="p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white/5 rounded">
          <div className="text-2xl font-bold">#{userRank || '-'}</div>
          <div className="text-sm text-white/50">Current Rank</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded">
          <div className="text-2xl font-bold">
            ${Number(stats.total_volume || 0).toLocaleString()}
          </div>
          <div className="text-sm text-white/50">Total Volume</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded">
          <div className="text-2xl font-bold">
            {Number(stats.total_trades || 0).toLocaleString()}
          </div>
          <div className="text-sm text-white/50">Total Trades</div>
        </div>
        <div className="text-center p-4 bg-white/5 rounded">
          <div className="text-2xl font-bold">
            {Number(stats.achievement_count || 0).toLocaleString()}
          </div>
          <div className="text-sm text-white/50">Achievements</div>
        </div>
      </div>
    </GlowBorder>
  );
} 