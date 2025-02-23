import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useEffect } from 'react';

export function useWallet() {
  const { publicKey, connected, connecting, disconnect, select } = useSolanaWallet();
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    if (primaryWallet?.address && !connected) {
      select('phantom');
    }
  }, [primaryWallet, connected, select]);

  return {
    publicKey: publicKey || (primaryWallet?.address ? { toBase58: () => primaryWallet.address } : null),
    isConnected: connected || !!primaryWallet?.address,
    isConnecting: connecting,
    disconnect,
    connect: () => select('phantom'),
    toBase58: () => publicKey?.toBase58() || primaryWallet?.address || null
  };
} 