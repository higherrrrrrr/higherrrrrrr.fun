import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

export function useWallet() {
  const { 
    primaryWallet,
    isConnecting,
    network,
    walletConnector
  } = useDynamicContext();

  return {
    address: primaryWallet?.address,
    isConnecting,
    isDisconnected: !primaryWallet,
    chain: {
      id: network?.id || 8453,
      name: network?.name || 'Base'
    },
    balance: primaryWallet?.balance
  };
} 