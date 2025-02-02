import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ethers } from 'ethers';
import { useCallback } from 'react';

export function useContract(address, abi) {
  const { primaryWallet } = useDynamicContext();

  const getContract = useCallback(() => {
    if (!primaryWallet?.provider || !address) return null;

    const provider = new ethers.BrowserProvider(primaryWallet.provider);
    return new ethers.Contract(address, abi, provider);
  }, [primaryWallet, address, abi]);

  const getSignerContract = useCallback(async () => {
    if (!primaryWallet?.provider || !address) return null;

    const provider = new ethers.BrowserProvider(primaryWallet.provider);
    const signer = await provider.getSigner();
    return new ethers.Contract(address, abi, signer);
  }, [primaryWallet, address, abi]);

  return {
    getContract,
    getSignerContract
  };
} 