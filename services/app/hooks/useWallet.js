import { useAccount, useNetwork, useBalance } from 'wagmi';

export function useWallet() {
  const { address, isConnecting, isDisconnected } = useAccount();
  const { chain } = useNetwork();
  const { data: balance } = useBalance({
    address: address,
  });

  return {
    address,
    isConnecting,
    isDisconnected,
    chain,
    balance,
  };
} 