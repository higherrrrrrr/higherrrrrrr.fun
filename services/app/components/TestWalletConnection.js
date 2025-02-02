import { useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';

export default function TestWalletConnection() {
  const { 
    primaryWallet, 
    isConnecting,
    sdkStatus,
    setShowAuthFlow,
    handleLogOut,
    network,
    switchNetwork
  } = useDynamicContext();
  
  const { address, chain, balance } = useWallet();

  const networks = [
    {
      chainId: 8453,
      name: 'Base',
    },
    {
      chainId: 1,
      name: 'Solana',
    }
  ];

  const onConnectClick = async () => {
    console.log("Connect button clicked");
    try {
      setShowAuthFlow(true);
    } catch (error) {
      console.error("Error connecting wallet:", error);
    }
  };

  const onDisconnectClick = async () => {
    console.log("Disconnect button clicked");
    try {
      await handleLogOut();
      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const onNetworkSwitch = async (chainId) => {
    try {
      await switchNetwork({ chainId: Number(chainId) });
      console.log(`Switched to network: ${chainId}`);
    } catch (error) {
      console.error("Error switching network:", error);
    }
  };

  return (
    <div className="p-4 space-y-6 text-green-500">
      <div className="space-y-2">
        <h3 className="text-lg font-bold">Connection Status</h3>
        <p>SDK Status: {sdkStatus}</p>
        <p>Connected: {primaryWallet ? 'Yes' : 'No'}</p>
        <p>Address: {address || 'Not connected'}</p>
        <p>Network: {chain?.name || 'Unknown'}</p>
        <p>Balance: {balance ? ethers.formatEther(balance) : '0'} ETH</p>
      </div>

      <div className="space-y-2">
        <button
          onClick={primaryWallet ? onDisconnectClick : onConnectClick}
          className="px-4 py-2 bg-green-500 text-black rounded hover:bg-green-400"
        >
          {primaryWallet ? 'Disconnect' : 'Connect'}
        </button>
      </div>

      {primaryWallet && (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Network Selection</h3>
          <select
            onChange={(e) => onNetworkSwitch(e.target.value)}
            value={chain?.id}
            className="bg-black border border-green-500 rounded px-2 py-1"
          >
            {networks.map((network) => (
              <option key={network.chainId} value={network.chainId}>
                {network.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-4 text-sm opacity-70">
        <pre className="bg-black/30 p-2 rounded overflow-auto">
          {JSON.stringify({
            isConnecting,
            hasWallet: !!primaryWallet,
            sdkStatus,
            networkConfigs: networks.map(n => n.name),
            currentChainId: chain?.id,
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
} 