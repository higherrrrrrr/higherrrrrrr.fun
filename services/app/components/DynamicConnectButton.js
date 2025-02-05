// components/DynamicConnectButton.js

'use client';

import React, { useState } from 'react';
import { useDynamicContext, DynamicUserProfile } from '@dynamic-labs/sdk-react-core';
import { DYNAMIC_CONFIG } from '../config/dynamic';

const DynamicConnectButton = ({ className, children }) => {
  const { setShowAuthFlow, primaryWallet, setShowDynamicUserProfile } = useDynamicContext();
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

  const handleAccountButtonClick = () => {
    setShowDynamicUserProfile(true);
  };

  if (error) {
    return (
      <div className="text-red-500 text-sm text-center">
        {error}
      </div>
    );
  }

  const buttonText = children || (primaryWallet 
    ? (primaryWallet.address 
      ? `${primaryWallet.address.substring(0, 6)}...${primaryWallet.address.substring(primaryWallet.address.length - 4)}`
      : "Account")
    : "Connect Wallet");

  return (
    <>
      <button 
        onClick={primaryWallet ? handleAccountButtonClick : handleConnect} 
        className={buttonClassName}
      >
        {buttonText}
      </button>
      <DynamicUserProfile />
    </>
  );
};

export default DynamicConnectButton;