import { DynamicContextProvider, useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { SolanaWalletConnectors } from '@dynamic-labs/solana';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';

export const FactoryContext = createContext(null);
export const useFactory = () => useContext(FactoryContext);

const ENVIRONMENT_ID = process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID;
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://rpc.higherrrrrrr.fun/';
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

function Web3ProviderInner({ children }) {
  const [factoryAddress, setFactoryAddress] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const { factory_address } = await getContractAddress();
        console.log('Factory address:', factory_address);
        
        if (mounted) {
          setFactoryAddress(factory_address);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('Failed to initialize Web3Provider:', error);
        if (mounted) {
          setError(error);
          setIsInitialized(true);
        }
      }
    }

    init();
    return () => { mounted = false; };
  }, []);

  if (!isInitialized) {
    return <div className="min-h-screen bg-black">
      <div className="text-green-500/50 p-4 font-mono">Initializing Web3...</div>
    </div>;
  }

  if (error) {
    return <div className="min-h-screen bg-black">
      <div className="text-red-500 p-4 font-mono">
        Failed to initialize: {error.message}
        <button onClick={() => window.location.reload()} className="ml-2 underline">
          Retry
        </button>
      </div>
    </div>;
  }

  if (!factoryAddress) {
    return <div className="min-h-screen bg-black">
      <div className="text-red-500 p-4 font-mono">
        No factory address found
        <button onClick={() => window.location.reload()} className="ml-2 underline">
          Retry
        </button>
      </div>
    </div>;
  }

  return (
    <FactoryContext.Provider value={factoryAddress}>
      {children}
    </FactoryContext.Provider>
  );
}

export function Web3Provider({ children }) {
  return (
    <DynamicContextProvider
      settings={{
        environmentId: ENVIRONMENT_ID,
        walletConnectors: [EthereumWalletConnectors],
        evmNetworks: [{
          blockExplorerUrl: 'https://basescan.org',
          chainId: 8453,
          chainName: 'Base',
          iconUrls: ['https://basescan.org/images/svg/brands/main.svg'],
          name: 'Base',
          nativeCurrency: {
            decimals: 18,
            name: 'Ethereum',
            symbol: 'ETH'
          },
          networkId: 8453,
          rpcUrls: [BASE_RPC],
          ticker: 'ETH',
          tickerName: 'Ethereum'
        }],
        defaultChain: {
          name: 'ethereum',
          network: 'base'
        },
        emailAuth: false,
        socialAuth: false,
        displayTermsOfService: false,
        requireEmailVerification: false,
        solanaNetwork: 'mainnet-beta',
        solanaRpcUrl: SOLANA_RPC,
        displaySiweWall: false,
        walletConnectV2AppName: 'Higherrrrrrr',
        multiWallet: true
      }}
      theme="dark"
      cssOverrides={{
        root: {
          "--dynamic-font-family": "monospace",
          "--dynamic-accent-color": "#22c55e",
          "--dynamic-text-color": "#22c55e",
          "--dynamic-background-color": "#000000",
          "--dynamic-border-color": "rgba(34, 197, 94, 0.2)",
          "--dynamic-hover-color": "rgba(34, 197, 94, 0.1)",
          "--dynamic-button-background": "#22c55e",
          "--dynamic-button-text-color": "#000000",
          "--dynamic-button-hover-background": "#16a34a",
        }
      }}
    >
      <Web3ProviderInner>{children}</Web3ProviderInner>
    </DynamicContextProvider>
  );
}

export function ConnectButton() {
  const { setShowAuthFlow, primaryWallet } = useDynamicContext();
  
  return (
    <button
      onClick={() => setShowAuthFlow(true)}
      className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors"
    >
      {primaryWallet ? 
        `${primaryWallet.address.slice(0, 6)}...${primaryWallet.address.slice(-4)}` : 
        "Connect Wallet"
      }
    </button>
  );
}

export const getCurrentChain = () => ({
  id: 8453,
  name: 'Base',
  network: 'base'
});

export const useConnectModal = () => {
  const { setShowAuthFlow } = useDynamicContext();
  return { openConnectModal: () => setShowAuthFlow(true) };
};
  