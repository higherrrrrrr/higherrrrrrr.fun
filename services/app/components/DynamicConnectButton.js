// components/DynamicConnectButton.jsx
'use client';

import React from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { DYNAMIC_CONFIG } from '../config/dynamic';

const DynamicConnectButton = ({ className, children }) => {
  const { handleLogOut, showAuthFlow, primaryWallet, user } = useDynamicContext();
  
  // Use the theme colors from config for consistent styling
  const defaultClassName = `w-full px-4 py-3 bg-[${DYNAMIC_CONFIG.theme.colors.primary}] hover:bg-[${DYNAMIC_CONFIG.theme.colors.primary}]/80 text-[${DYNAMIC_CONFIG.theme.colors.secondary}] font-mono font-bold rounded transition-colors`;
  const buttonClassName = className || defaultClassName;

  if (primaryWallet) {
    return (
      <button
        onClick={handleLogOut}
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
      onClick={() => showAuthFlow()}
      className={buttonClassName}
    >
      {children || "Connect Wallet"}
    </button>
  );
};

export default DynamicConnectButton;
