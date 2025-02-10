'use client';
import { useState, useEffect, Suspense } from 'react';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { useWebSocket } from '@/hooks/useWebSocket';
import { ErrorBoundary } from './ErrorBoundary';
import TokenPrice from './TokenPrice';
import ProfileTabs from './ProfileTabs';
import PnLChart from './PnLChart';
import TransactionHistory from './TransactionHistory';
import ProfileSkeleton from './ProfileSkeleton';
import type { Portfolio, PnLData } from '@/lib/types';
import { getWalletTokens, getWalletTransactions } from '@/lib/helius';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { formatNumber } from '@/lib/format';

interface SectionProps {
  children: React.ReactNode;
  title: string;
  loading?: boolean;
}

export default function UserProfile() {
  const { primaryWallet } = useDynamicContext();
  const { portfolio, isLoading, error } = usePortfolioData();
  const [activeTab, setActiveTab] = useState('holdings');

  useWebSocket({
    tokens: portfolio?.tokens,
    onPriceUpdate: (data) => {
      if (!portfolio?.tokens) return;
      
      const updatedTokens = portfolio.tokens.map(token => {
        if (token.address === data.address) {
          const newValue = Number(token.amount) * data.price;
          return {
            ...token,
            price: data.price,
            value: newValue,
            priceChange24h: data.priceChange24h
          };
        }
        return token;
      });

      const totalValue = updatedTokens.reduce((sum, token) => sum + token.value, 0);
      const change24h = calculatePortfolioChange(updatedTokens);
      
      portfolio.tokens = updatedTokens;
      portfolio.totalValue = totalValue;
      portfolio.change24h = change24h;
    }
  });

  if (!primaryWallet) {
    return (
      <div className="p-4 border border-green-500/30 rounded-lg">
        <p className="text-green-500">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-green-500/10 rounded mb-4" />
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-green-500/10 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/30 rounded-lg bg-red-500/10">
        <h2 className="text-red-500 font-bold mb-2">Error loading profile</h2>
        <p className="text-red-500/70">{error.message}</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="p-4 border border-green-500/30 rounded-lg">
        <p className="text-green-500">No portfolio data available</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />
        
        <Suspense fallback={<ProfileSkeleton />}>
          {activeTab === 'holdings' && (
            <Section title="Portfolio Holdings" loading={isLoading}>
              {portfolio && portfolio.tokens ? (
                <PortfolioSection portfolio={portfolio} />
              ) : (
                <div className="bg-black border border-green-500/30 rounded-lg p-6">
                  <p className="text-green-500/70">No portfolio data available</p>
                </div>
              )}
            </Section>
          )}
          
          {activeTab === 'pnl' && (
            <Section title="P&L Analytics" loading={isLoading}>
              {portfolio && <PnLChart data={portfolio} />}
            </Section>
          )}
          
          {activeTab === 'history' && portfolio?.transactions && (
            <Section title="Transaction History" loading={isLoading}>
              <TransactionHistory transactions={portfolio.transactions} />
            </Section>
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}

function Section({ children, title, loading }: SectionProps) {
  if (loading) return <ProfileSkeleton />;
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {children}
    </div>
  );
}

function PortfolioSection({ portfolio }: { portfolio: Portfolio }) {
  const formatValue = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  };

  const formatChange = (change: string | number) => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    return isNaN(num) ? '+0.00' : (num >= 0 ? '+' : '') + num.toFixed(2);
  };

  const getChangeColor = (change: string | number) => {
    const num = typeof change === 'string' ? parseFloat(change) : change;
    return isNaN(num) ? 'text-gray-500' : 
           num > 0 ? 'text-green-500' : 
           num < 0 ? 'text-red-500' : 'text-gray-500';
  };

  if (!portfolio || !portfolio.tokens) {
    return (
      <div className="space-y-4">
        <div className="bg-black border border-green-500/30 rounded-lg p-6">
          <h3 className="text-sm text-green-500/70 mb-2">No portfolio data available</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-black border border-green-500/30 rounded-lg p-6">
          <h3 className="text-sm text-green-500/70 mb-2">Total Value</h3>
          <div className="flex items-center">
            <span className="text-2xl font-bold">${formatNumber(portfolio.totalValue)}</span>
            <span className={`text-2xl font-bold ${getChangeColor(portfolio.change24h)}`}>
              {formatChange(portfolio.change24h)}%
            </span>
          </div>
        </div>
        <div className="bg-black border border-green-500/30 rounded-lg p-6">
          <h3 className="text-sm text-green-500/70 mb-2">24h Change</h3>
          <div className="flex items-center">
            <span className={`text-2xl font-bold ${getChangeColor(portfolio.change24h)}`}>
              {formatChange(portfolio.change24h)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="bg-black border border-green-500/30 rounded-lg p-6">
        <table className="w-full">
          <thead>
            <tr className="text-left text-green-500/70">
              <th className="pb-4">Token</th>
              <th className="pb-4">Amount</th>
              <th className="pb-4">Price</th>
              <th className="pb-4">Value</th>
              <th className="pb-4">24h</th>
            </tr>
          </thead>
          <tbody>
            {portfolio.tokens.map(token => (
              <tr key={token.address} className="border-t border-green-500/10">
                <td className="py-4">{token.symbol}</td>
                <td className="py-4">{formatValue(token.amount)} {token.symbol}</td>
                <td className="py-4">
                  <TokenPrice 
                    price={token.price} 
                    priceChange={token.priceChange24h}
                    timeframe="24h"
                  />
                </td>
                <td className="py-4">${formatValue(token.value)}</td>
                <td className="py-4">
                  <span className={getChangeColor(token.priceChange24h)}>
                    {formatChange(token.priceChange24h)}%
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

function calculatePortfolioChange(tokens: any[]): number {
  return tokens.reduce((total, token) => {
    const change = token.priceChange24h || 0;
    const weight = token.value / tokens.reduce((sum, t) => sum + t.value, 0);
    return total + (change * weight);
  }, 0);
}

function transformHeliusTokens(tokens: any[]) {
  return tokens.map(token => ({
    address: token.id,
    symbol: token.symbol || 'Unknown',
    name: token.name || 'Unknown Token',
    amount: token.amount || '0',
    price: token.price || 0,
    value: (token.amount || 0) * (token.price || 0),
    priceChange24h: token.priceChange?.h24 || 0
  }));
} 