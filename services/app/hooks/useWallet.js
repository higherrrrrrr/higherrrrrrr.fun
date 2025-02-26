'use client';

import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export function useWallet() {
  const { primaryWallet, isLoading } = useDynamicContext();
  
  return {
    address: primaryWallet?.address,
    isConnecting: isLoading,
    isDisconnected: !primaryWallet,
    // Return consistent properties that maintain API compatibility with existing code
    chain: primaryWallet?.chain || null,
    balance: null, // Dynamic doesn't provide balance directly like wagmi
  };
} 