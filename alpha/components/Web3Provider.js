import { WagmiConfig, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { ConnectKitProvider, ConnectKitButton as DefaultConnectButton, getDefaultConfig, useModal } from 'connectkit';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';
import { http } from 'viem';
import { InjectedConnector } from 'wagmi/connectors/injected';

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

// Create config with Rabby support and default connectors
const wagmiConfig = createConfig({
  ...getDefaultConfig({
    appName: "Higherrrrrrr",
    chains,
    transports: {
      [baseChain.id]: http(ALCHEMY_RPC),
    },
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
  }),
  connectors: [
    // Filter out any injected connectors from default config
    ...getDefaultConfig({
      appName: "Higherrrrrrr",
      chains,
      walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
    }).connectors.filter(connector => 
     connector.id !== 'injected' && connector.id !== 'rabby'
    ),
    // Add our custom Rabby connector
    new InjectedConnector({
      chains,
      options: {
        name: 'Rabby',
        getProvider: () => typeof window !== 'undefined' ? window.ethereum : undefined,
      },
    }),
  ],
});

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
        theme="minimal"
        mode="dark"
        customTheme={{
          "--ck-font-family": "monospace",
          "--ck-accent-color": "#22c55e",
          "--ck-accent-text-color": "#000000",
          
          // Modal background
          "--ck-body-background": "#000000",
          "--ck-body-color": "#22c55e",
          "--ck-body-color-muted": "rgba(34, 197, 94, 0.6)",
          "--ck-body-action-color": "#22c55e",
          
          // Buttons
          "--ck-primary-button-background": "#22c55e",
          "--ck-primary-button-color": "#000000",
          "--ck-primary-button-hover-background": "#16a34a",
          
          // Secondary buttons
          "--ck-secondary-button-background": "transparent",
          "--ck-secondary-button-border": "1px solid #22c55e",
          "--ck-secondary-button-color": "#22c55e",
          
          // Borders and overlay
          "--ck-body-border": "1px solid rgba(34, 197, 94, 0.2)",
          "--ck-body-border-radius": "4px",
          "--ck-overlay-background": "rgba(0, 0, 0, 0.95)",
          
          // Focus and hover states
          "--ck-button-hover-opacity": "0.8",
          "--ck-focus-color": "#22c55e",
          
          // QR code
          "--ck-qr-border-radius": "4px",
          "--ck-qr-dot-color": "#22c55e",
          "--ck-qr-background": "#000000",
          
          // Dropdown
          "--ck-dropdown-button-background": "#000000",
          "--ck-dropdown-button-hover-background": "rgba(34, 197, 94, 0.1)",
          "--ck-dropdown-button-color": "#22c55e",
          
          // Misc
          "--ck-tooltip-background": "#000000",
          "--ck-tooltip-color": "#22c55e",
          "--ck-spinner-color": "#22c55e"
        }}
        options={{
          initialChainId: baseChain.id,
          hideQuestionMarkCTA: true,
          hideTooltips: true,
          embedGoogleFonts: false,
          walletConnectName: "More Wallets"
        }}
      >
        <Web3ProviderInner>{children}</Web3ProviderInner>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export function ConnectKitButton() {
  return (
    <DefaultConnectButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            onClick={show}
            className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors"
          >
            {isConnected ? (ensName ?? truncatedAddress) : "Connect Wallet"}
          </button>
        );
      }}
    </DefaultConnectButton.Custom>
  );
}

export const getCurrentChain = () => baseChain;

export const useConnectModal = useModal;
  