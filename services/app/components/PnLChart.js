'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// Check if recharts is available
let ChartComponents;
try {
  ChartComponents = require('recharts');
} catch (e) {
  console.warn('Recharts package not available, using fallback chart');
  ChartComponents = null;
}

export default function PnLChart({ walletAddress, period = 'month' }) {
  const [pnlData, setPnlData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchPnLData() {
      if (!walletAddress) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/analytics/pnl-history?wallet_address=${walletAddress}&period=${period}`);
        const data = await response.json();
        
        if (data.success) {
          setPnlData(data.pnl_history || []);
        } else {
          setError(data.error || 'Failed to fetch PnL data');
        }
      } catch (err) {
        console.error('Error fetching PnL data:', err);
        setError('Failed to fetch PnL data');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchPnLData();
  }, [walletAddress, period]);
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-red-500 text-center h-full flex items-center justify-center">
        {error}
      </div>
    );
  }
  
  if (!pnlData || pnlData.length === 0) {
    return (
      <div className="text-green-500 text-center h-full flex items-center justify-center">
        No PnL data available for this period
      </div>
    );
  }
  
  // If recharts is not available, fallback to a simple table
  if (!ChartComponents) {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Daily PnL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Cumulative PnL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trades</th>
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700">
            {pnlData.map((day, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{formatDate(day.date)}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${day.daily_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(day.daily_pnl)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm ${day.cumulative_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(day.cumulative_pnl)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{day.trade_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  
  // If recharts is available, use the chart
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = ChartComponents;
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={pnlData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate} 
          stroke="#718096"
        />
        <YAxis 
          tickFormatter={value => formatCurrency(value)} 
          stroke="#718096"
        />
        <Tooltip 
          formatter={(value) => [formatCurrency(value), 'Amount']}
          labelFormatter={formatDate}
          contentStyle={{ backgroundColor: '#1f2937', border: 'none', color: '#e2e8f0' }}
        />
        <Legend wrapperStyle={{ color: '#e2e8f0' }} />
        <Line 
          type="monotone" 
          dataKey="daily_pnl" 
          name="Daily PnL" 
          stroke="#38a169" 
          activeDot={{ r: 8 }} 
          dot={{ r: 3 }}
        />
        <Line 
          type="monotone" 
          dataKey="cumulative_pnl" 
          name="Cumulative PnL" 
          stroke="#4299e1" 
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
} 