"use client";

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';

export default function ProfilePage() {
  const { primaryWallet } = useDynamicContext();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [portfolioValue, setPortfolioValue] = useState(0);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (num, decimals = 4) => {
    if (num === undefined || num === null) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  useEffect(() => {
    async function fetchUserAssets() {
      if (!primaryWallet?.address) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/helius/assets?owner=${primaryWallet.address}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch assets');
        }

        // Calculate total portfolio value
        let totalValue = 0;

        // Add SOL value
        if (data.nativeBalance) {
          const solValue = (data.nativeBalance.lamports / LAMPORTS_PER_SOL) * data.nativeBalance.price_per_sol;
          totalValue += solValue;
        }

        // Add token values
        data.items.forEach(asset => {
          if (asset.token_info?.price_info?.total_price) {
            totalValue += asset.token_info.price_info.total_price;
          }
        });

        setPortfolioValue(totalValue);
        setAssets(data.items || []);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching assets:', err);
        setError('Failed to fetch profile data');
        setLoading(false);
      }
    }

    fetchUserAssets();
  }, [primaryWallet?.address]);

  if (!primaryWallet?.address) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-mono text-green-500 mb-4">Profile</h1>
        <p className="text-green-500/70 font-mono">Please connect your wallet to view your profile</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-green-500 font-mono">Loading profile...</div>
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
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-black/30 border border-green-500/30 rounded-lg p-6 mb-8">
          <h1 className="text-2xl font-mono text-green-500 mb-4">Profile</h1>
          <div className="flex flex-col gap-4">
            <div className="text-green-500/70 font-mono break-all">
              {primaryWallet.address}
            </div>
            <div className="text-2xl font-mono text-green-400">
              Portfolio Value: {formatCurrency(portfolioValue)}
            </div>
          </div>
        </div>

        {/* Assets Section */}
        <div className="bg-black/30 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-mono text-green-500 mb-6">Your Assets</h2>
          
          {assets.length === 0 ? (
            <p className="text-green-500/70 font-mono">No assets found</p>
          ) : (
            <div className="space-y-4">
              {assets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="border border-green-500/30 rounded-lg p-4 hover:border-green-500/60 transition-colors"
                >
                  <div className="flex gap-4">
                    {/* Image Section */}
                    {asset.content?.files?.[0]?.uri && (
                      <div className="flex-shrink-0 w-48">
                        <img 
                          src={asset.content.files[0].uri} 
                          alt={asset.content?.metadata?.name}
                          className="w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Info Section */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-green-500 font-mono text-lg">
                            {asset.content?.metadata?.name || asset.token_info?.symbol || 'Unnamed Asset'}
                          </h3>
                          {asset.token_info?.balance && (
                            <p className="text-green-500/70 font-mono">
                              Balance: {formatNumber(asset.token_info.balance / Math.pow(10, asset.token_info.decimals || 0))} {asset.token_info.symbol}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {asset.token_info?.price_info && (
                            <>
                              <div className="text-green-400 font-mono">
                                {formatCurrency(asset.token_info.price_info.total_price)}
                              </div>
                              <div className="text-green-500/50 text-sm font-mono">
                                {formatCurrency(asset.token_info.price_info.price_per_token)} per token
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                      
                      {asset.content?.metadata?.description && (
                        <p className="text-green-500/70 font-mono text-sm mt-2">
                          {asset.content.metadata.description.slice(0, 100)}
                          {asset.content.metadata.description.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 