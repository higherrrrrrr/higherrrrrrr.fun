import React from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { switchNetwork } from '../utils/networkSwitcher';

export default function NetworkSwitcher({ targetChain, children }) {
  const { primaryWallet } = useDynamicContext();

  // Detect current chain type based on wallet connector
  const currentChainType = primaryWallet?.connector
    ? primaryWallet.connector.name.toLowerCase().includes('phantom')
      ? 'solana'
      : 'base'
    : null;

  const handleSwitch = async () => {
    if (currentChainType === targetChain) {
      console.log("Already on target chain:", targetChain);
      return;
    }
    
    try {
      await switchNetwork(targetChain);
      console.log(`Switched network to ${targetChain}`);
    } catch (error) {
      console.error("Network switching failed:", error);
      // You could add a toast notification here
    }
  };

  return (
    <button 
      onClick={handleSwitch} 
      className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400 transition-colors"
    >
      {children || `Switch to ${targetChain}`}
    </button>
  );
} 