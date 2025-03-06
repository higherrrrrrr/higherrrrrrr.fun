'use client';

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import PnLChart from '@/components/PnLChart';

export default function PortfolioPage() {
  const { primaryWallet } = useDynamicContext();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartPeriod, setChartPeriod] = useState('month');

  // Format as currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format as percentage
  const formatPercent = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  };

  // Fetch portfolio data
  useEffect(() => {
    async function fetchPortfolio() {
      if (!primaryWallet?.address) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/portfolio?wallet_address=${primaryWallet.address}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch portfolio data');
        }
        
        const data = await response.json();
        if (data.success) {
          setPortfolio(data.portfolio);
        } else {
          throw new Error(data.error || 'Unknown error');
        }
      } catch (err) {
        console.error('Error fetching portfolio:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchPortfolio();
  }, [primaryWallet?.address]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-green-500 font-mono">Loading portfolio...</div>
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

  if (!portfolio) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-yellow-500 font-mono">No portfolio data found.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Portfolio</h1>
      
      {/* Portfolio Summary */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-gray-700 rounded-lg">
          <h3 className="text-gray-400 text-sm">Portfolio Value</h3>
          <p className="text-white text-xl font-bold">{formatCurrency(portfolio.summary.market_value)}</p>
        </div>
        <div className="p-4 border border-gray-700 rounded-lg">
          <h3 className="text-gray-400 text-sm">Total P&L</h3>
          <p className={`text-xl font-bold ${portfolio.summary.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(portfolio.summary.total_pnl)}
          </p>
        </div>
        <div className="p-4 border border-gray-700 rounded-lg">
          <h3 className="text-gray-400 text-sm">Realized P&L</h3>
          <p className={`text-xl font-bold ${portfolio.summary.realized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(portfolio.summary.realized_pnl)}
          </p>
        </div>
        <div className="p-4 border border-gray-700 rounded-lg">
          <h3 className="text-gray-400 text-sm">Trading Volume</h3>
          <p className="text-white text-xl font-bold">{formatCurrency(portfolio.summary.total_volume)}</p>
        </div>
      </div>
      
      {/* PnL Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">P&L History</h2>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-end mb-4">
            <div className="flex space-x-2">
              {['day', 'week', 'month', 'year', 'all'].map((period) => (
                <button
                  key={period}
                  onClick={() => setChartPeriod(period)}
                  className={`px-3 py-1 text-sm rounded ${
                    chartPeriod === period
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {period.charAt(0).toUpperCase() + period.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="h-80">
            {primaryWallet?.address && (
              <PnLChart 
                walletAddress={primaryWallet.address} 
                period={chartPeriod} 
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Positions Table */}
      <h2 className="text-xl font-bold mb-4">Your Positions</h2>
      {portfolio.positions.length === 0 ? (
        <p className="text-gray-400">No open positions found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg overflow-hidden">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Token</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Avg Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Current Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Market Value</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Unrealized P&L</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">P&L %</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {portfolio.positions.map((position) => (
                <tr key={position.token_address}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {position.token_logo && (
                        <img 
                          src={position.token_logo} 
                          alt={position.token_symbol || 'token'} 
                          className="w-6 h-6 rounded-full mr-2" 
                          onError={(e) => e.target.style.display = 'none'} 
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium text-white">
                          {position.token_symbol || position.token_address.substring(0, 8) + '...'}
                        </div>
                        <div className="text-xs text-gray-400">
                          {position.token_name || position.token_address.substring(0, 8) + '...'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {parseFloat(position.quantity).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatCurrency(position.avg_cost_basis)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatCurrency(position.current_price || position.last_price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatCurrency(position.market_value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={position.unrealized_pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatCurrency(position.unrealized_pnl)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={position.unrealized_pnl_percent >= 0 ? 'text-green-500' : 'text-red-500'}>
                      {formatPercent(position.unrealized_pnl_percent)}
                    </span>
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
