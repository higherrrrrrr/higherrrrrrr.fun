// pages/profile.js
import React from 'react';
import { useAccount } from 'wagmi';
import Link from 'next/link';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();

  // A placeholder for token holdings; replace this with your real API call or hook.
  const tokenHoldings = [
    { symbol: 'HIGH', balance: 150 },
    { symbol: 'CULT', balance: 75 },
    { symbol: 'DEGEN', balance: 300 },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-green-500 font-mono">
        <p>Please connect your wallet to view your profile.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-4">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="flex flex-col items-center space-y-4">
          {/* Profile Picture */}
          <div className="w-24 h-24 rounded-full overflow-hidden border border-green-500/30">
            <img
              src="/placeholder-profile.png"
              alt="Profile Picture"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">Your Profile</h1>
          <p className="break-all">
            <span className="font-bold">Address:</span> {address}
          </p>
          <Link 
            href={`/${address}/settings`}
            className="mt-2 px-4 py-2 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors"
          >
            Edit Profile Settings
          </Link>
        </div>

        {/* Token Holdings Section */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Token Holdings</h2>
          {tokenHoldings.length === 0 ? (
            <p>No token holdings found.</p>
          ) : (
            <ul className="space-y-2">
              {tokenHoldings.map((token, idx) => (
                <li
                  key={idx}
                  className="px-4 py-2 border border-green-500/30 rounded hover:bg-green-500/10 transition-colors"
                >
                  <span className="font-bold">{token.symbol}</span>: {token.balance}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
