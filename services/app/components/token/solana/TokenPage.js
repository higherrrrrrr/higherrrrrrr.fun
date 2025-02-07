'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

// Mock data
const MOCK_TOKEN_STATE = {
  symbol: "MOCK",
  currentPrice: "0.1",
  totalSupply: "1000000",
  currentName: "Mock Token",
  marketType: 0,
  priceLevels: [
    { name: "Level 1", price: "0.1" },
    { name: "Level 2", price: "0.2" },
    { name: "Level 3", price: "0.3" }
  ]
};

export function SolanaTokenPage({ addressProp }) {
  const params = useParams();
  const address = addressProp || params.address;
  
  return (
    <div className="min-h-screen bg-black text-green-500 font-mono p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Solana Integration Coming Soon!</h1>
        
        <div className="space-y-4">
          <div className="p-4 border border-green-500/30 rounded">
            <h2 className="text-xl mb-2">Token Details</h2>
            <p>Address: {address}</p>
            <p>Symbol: {MOCK_TOKEN_STATE.symbol}</p>
            <p>Current Name: {MOCK_TOKEN_STATE.currentName}</p>
          </div>

          <div className="p-4 border border-green-500/30 rounded">
            <h2 className="text-xl mb-2">Price Levels</h2>
            <div className="space-y-2">
              {MOCK_TOKEN_STATE.priceLevels.map((level, index) => (
                <div key={index} className="flex justify-between">
                  <span>{level.name}</span>
                  <span>{level.price} SOL</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border border-green-500/30 rounded">
            <h2 className="text-xl mb-2">Trading</h2>
            <p className="text-green-500/70">
              Solana trading functionality will be available soon.
            </p>
          </div>
        </div>

        <div className="mt-8 text-center text-green-500/50">
          <p>We're working on bringing the full Solana experience to Higher.</p>
          <p>Stay tuned for updates!</p>
        </div>
      </div>
    </div>
  );
} 