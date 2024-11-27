import { WagmiConfig, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { ConnectKitProvider, ConnectKitButton as DefaultConnectButton, getDefaultConfig } from 'connectkit';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';
import { http } from 'viem';

export const FactoryContext = createContext(null);
export const useFactory = () => useContext(FactoryContext);

const ALCHEMY_RPC = 'https://base-mainnet.g.alchemy.com/v2/l0XzuD715Z-zd21ie5dbpLKrptTuq07a';
const WALLETCONNECT_PROJECT_ID = 'a893723ca57a205513119f91ba5c09c8';

// Completely override Base chain with our RPC
const baseChain = {
  ...base,
  rpcUrls: {
    default: {
      http: [ALCHEMY_RPC],
      webSocket: []
    },
    public: {
      http: [ALCHEMY_RPC],
      webSocket: []
    },
    alchemy: {
      http: [ALCHEMY_RPC],
      webSocket: []
    }
  }
};

const chains = [baseChain];

// Create config outside of component to prevent recreation
const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Higherrrrrrr",
    chains,
    transports: {
      [baseChain.id]: http(ALCHEMY_RPC),
    },
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
  }),
);

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
          setIsInitialized(true); // Still mark as initialized even on error
        }
      }
    }

    init();

    // Cleanup function
    return () => {
      mounted = false;
    };
  }, []);

  // Show loading state
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-black">
        <div className="text-green-500/50 p-4 font-mono">Initializing Web3...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <div className="text-red-500 p-4 font-mono">
          Failed to initialize: {error.message}
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Only render children when we have the factory address
  if (!factoryAddress) {
    return (
      <div className="min-h-screen bg-black">
        <div className="text-red-500 p-4 font-mono">
          No factory address found
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 underline"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <FactoryContext.Provider value={factoryAddress}>
      {children}
    </FactoryContext.Provider>
  );
}

export function Web3Provider({ children }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <ConnectKitProvider
        customTheme={{
          "--ck-font-family": "monospace",
          "--ck-accent-color": "#22c55e",
          "--ck-accent-text-color": "#000000",
        }}
        options={{
          initialChainId: baseChain.id,
        }}
      >
        <Web3ProviderInner>{children}</Web3ProviderInner>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export function ConnectKitButton() {
  return <DefaultConnectButton />;
}

export const getCurrentChain = () => baseChain; 