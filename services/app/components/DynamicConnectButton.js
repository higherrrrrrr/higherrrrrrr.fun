// components/DynamicConnectButton.jsx
'use client';

import React, { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { DYNAMIC_CONFIG } from '../config/dynamic';

const DynamicConnectButton = ({ className, children }) => {
  const { handleLogOut, setShowAuthFlow, primaryWallet, user } = useDynamicContext();
  const [error, setError] = useState(null);
  
  // Use the theme colors from config for consistent styling
  const defaultClassName = `w-full px-4 py-3 bg-[${DYNAMIC_CONFIG.theme.colors.primary}] hover:bg-[${DYNAMIC_CONFIG.theme.colors.primary}]/80 text-[${DYNAMIC_CONFIG.theme.colors.secondary}] font-mono font-bold rounded transition-colors`;
  const buttonClassName = className || defaultClassName;

  const handleConnect = async () => {
    try {
      setError(null);
      setShowAuthFlow(true);
    } catch (err) {
      console.error('Failed to connect wallet:', err);
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await handleLogOut();
    } catch (err) {
      console.error('Failed to disconnect wallet:', err);
      setError('Failed to disconnect wallet. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="text-red-500 text-sm text-center">
        {error}
      </div>
    );
  }

  if (primaryWallet) {
    return (
      <button
        onClick={handleDisconnect}
        className={buttonClassName}
      >
        {children || (
          <span>
            {user?.primaryWallet?.address?.slice(0, 6)}...
            {user?.primaryWallet?.address?.slice(-4)}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={handleConnect}
      className={buttonClassName}
    >
      {children || "Connect Wallet"}
    </button>
  );
};

export default DynamicConnectButton;
