"use client";

import { useEffect, useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export default function ProfilePage() {
  const { primaryWallet } = useDynamicContext();
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          <div className="flex items-center gap-4">
            <div className="text-green-500/70 font-mono break-all">
              {primaryWallet.address}
            </div>
          </div>
        </div>

        {/* Assets Section */}
        <div className="bg-black/30 border border-green-500/30 rounded-lg p-6">
          <h2 className="text-xl font-mono text-green-500 mb-6">Your Assets</h2>
          
          {assets.length === 0 ? (
            <p className="text-green-500/70 font-mono">No assets found</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assets.map((asset) => (
                <div 
                  key={asset.id} 
                  className="border border-green-500/30 rounded-lg p-4 hover:border-green-500/60 transition-colors"
                >
                  {asset.content?.files?.[0]?.uri && (
                    <img 
                      src={asset.content.files[0].uri} 
                      alt={asset.content?.metadata?.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                  )}
                  <h3 className="text-green-500 font-mono text-lg mb-2">
                    {asset.content?.metadata?.name || 'Unnamed Asset'}
                  </h3>
                  <p className="text-green-500/70 font-mono text-sm">
                    {asset.content?.metadata?.description?.slice(0, 100)}
                    {asset.content?.metadata?.description?.length > 100 ? '...' : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 