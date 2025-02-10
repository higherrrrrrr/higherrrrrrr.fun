'use client';
import { useState } from 'react';

export default function TransactionHistory({ transactions }) {
  const [filter, setFilter] = useState('all');

  const exportToCSV = () => {
    const headers = ['Date', 'Type', 'Token', 'Amount', 'Price', 'Value', 'P&L'];
    const csvData = transactions.map(tx => [
      new Date(tx.timestamp).toLocaleString(),
      tx.type,
      tx.token.symbol,
      tx.amount,
      tx.price,
      tx.value,
      tx.pnl
    ]);

    const csv = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-black border border-green-500/30 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all' ? 'bg-green-500/20 text-green-500' : 'text-gray-500'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('buy')}
            className={`px-4 py-2 rounded ${
              filter === 'buy' ? 'bg-green-500/20 text-green-500' : 'text-gray-500'
            }`}
          >
            Buys
          </button>
          <button
            onClick={() => setFilter('sell')}
            className={`px-4 py-2 rounded ${
              filter === 'sell' ? 'bg-green-500/20 text-green-500' : 'text-gray-500'
            }`}
          >
            Sells
          </button>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-green-500/20 text-green-500 rounded hover:bg-green-500/30"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left border-b border-green-500/30">
              <th className="py-4 px-6">Date</th>
              <th className="py-4 px-6">Type</th>
              <th className="py-4 px-6">Token</th>
              <th className="py-4 px-6">Amount</th>
              <th className="py-4 px-6">Price</th>
              <th className="py-4 px-6">Value</th>
              <th className="py-4 px-6">P&L</th>
            </tr>
          </thead>
          <tbody>
            {transactions
              .filter(tx => filter === 'all' || tx.type === filter)
              .map(tx => (
                <tr key={tx.id} className="border-b border-green-500/10">
                  <td className="py-4 px-6">
                    {new Date(tx.timestamp).toLocaleString()}
                  </td>
                  <td className="py-4 px-6">
                    <span className={tx.type === 'buy' ? 'text-green-500' : 'text-red-500'}>
                      {tx.type.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-4 px-6">{tx.token.symbol}</td>
                  <td className="py-4 px-6">{tx.amount.toFixed(2)}</td>
                  <td className="py-4 px-6">${tx.price.toFixed(2)}</td>
                  <td className="py-4 px-6">${tx.value.toFixed(2)}</td>
                  <td className="py-4 px-6">
                    <span className={tx.pnl >= 0 ? 'text-green-500' : 'text-red-500'}>
                      ${tx.pnl.toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 