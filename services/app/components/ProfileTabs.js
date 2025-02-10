'use client';
import { useState } from 'react';

export default function ProfileTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'holdings', label: 'Holdings' },
    { id: 'pnl', label: 'P&L Analytics' },
    { id: 'history', label: 'Transaction History' }
  ];

  return (
    <div className="border-b border-green-500/30 mb-6">
      <nav className="flex space-x-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                ? 'border-green-500 text-green-500'
                : 'border-transparent text-gray-500 hover:text-green-500/70 hover:border-green-500/30'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
} 