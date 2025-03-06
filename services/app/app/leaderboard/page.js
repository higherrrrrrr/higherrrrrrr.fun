'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get sort parameter with default
  const sortBy = searchParams.get('sort_by') || 'total_realized_pnl';
  
  // Format as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  // Handle sort change
  const handleSortChange = (newSortBy) => {
    const params = new URLSearchParams(searchParams);
    params.set('sort_by', newSortBy);
    router.push(`/leaderboard?${params.toString()}`);
  };
  
  // Format wallet address for display
  const formatWalletAddress = (address) => {
    if (!address) return '';
    if (address.length <= 12) return address;
    return `${address.substring(0, 4)}...${address.substring(address.length - 4)}`;
  };
  
  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const response = await fetch(`/api/leaderboard?sort_by=${sortBy}&limit=25`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard data');
        }
        
        const data = await response.json();
        if (data.success) {
          setLeaderboard(data.leaderboard);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLeaderboard();
  }, [sortBy]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-green-500 font-mono">Loading leaderboard...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-red-500 font-mono">{error}</div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Trader Leaderboard</h1>
      
      {/* Sorting Controls */}
      <div className="flex flex-wrap mb-6 gap-2">
        <button
          className={`px-4 py-2 rounded ${sortBy === 'total_realized_pnl' ? 'bg-green-600' : 'bg-gray-700'}`}
          onClick={() => handleSortChange('total_realized_pnl')}
        >
          By Realized PnL
        </button>
        <button
          className={`px-4 py-2 rounded ${sortBy === 'total_volume' ? 'bg-green-600' : 'bg-gray-700'}`}
          onClick={() => handleSortChange('total_volume')}
        >
          By Volume
        </button>
        <button
          className={`px-4 py-2 rounded ${sortBy === 'trade_count' ? 'bg-green-600' : 'bg-gray-700'}`}
          onClick={() => handleSortChange('trade_count')}
        >
          By Trade Count
        </button>
        <button
          className={`px-4 py-2 rounded ${sortBy === 'largest_trade_value' ? 'bg-green-600' : 'bg-gray-700'}`}
          onClick={() => handleSortChange('largest_trade_value')}
        >
          By Largest Trade
        </button>
      </div>
      
      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <p className="text-gray-400">No traders found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trader</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Realized PnL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Volume</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trades</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Largest Trade</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {leaderboard.map((trader, index) => (
                <tr key={trader.wallet_address}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link href={`/profile?wallet=${trader.wallet_address}`} className="text-sm font-medium text-blue-400 hover:text-blue-300">
                      {formatWalletAddress(trader.wallet_address)}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={parseFloat(trader.total_realized_pnl) >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatCurrency(trader.total_realized_pnl)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(trader.total_volume)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {trader.trade_count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(trader.largest_trade_value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
