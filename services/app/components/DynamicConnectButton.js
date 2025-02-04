'use client';

import React, { useState } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { DYNAMIC_CONFIG } from '../config/dynamic';

const DynamicConnectButton = ({ className, children }) => {
  const { handleLogOut, setShowAuthFlow, primaryWallet } = useDynamicContext();
  const [error, setError] = useState(null);

  // Compact button with thicker border and aligned text
  const defaultClassName =
    'px-4 py-2 border-2 border-green-500/20 rounded hover:border-green-500/40 transition-colors hover:bg-green-500/5 text-green-500 font-mono text-sm inline-flex items-center justify-center';
  const buttonClassName = className || defaultClassName;

  const handleConnect = async () => {
    try {
      setError(null);
      setShowAuthFlow(true);
    } catch (err) {
      setError('Failed to connect wallet. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    try {
      setError(null);
      await handleLogOut();
    } catch (err) {
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
      <button onClick={handleDisconnect} className={buttonClassName}>
        {children || "Disconnect Wallet"}
      </button>
    );
  }

  return (
    <button onClick={handleConnect} className={buttonClassName}>
      {children || "Connect Wallet"}
    </button>
  );
};

export default DynamicConnectButton;
