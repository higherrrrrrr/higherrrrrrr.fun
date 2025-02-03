import { WagmiConfig, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { ConnectKitProvider, ConnectKitButton as DefaultConnectButton, getDefaultConfig, useModal } from 'connectkit';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';
import { http } from 'viem';
import { InjectedConnector } from 'wagmi/connectors/injected';

// Create contexts
export const FactoryContext = createContext();
export const useFactory = () => useContext(FactoryContext);

// Configuration
const ALCHEMY_RPC = process.env.NEXT_PUBLIC_ALCHEMY_RPC;
const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

// Define Base chain with complete configuration
const baseChain = {
  id: 8453,
  name: 'Base',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: [ALCHEMY_RPC],
      webSocket: [],
    },
    public: {
      http: [ALCHEMY_RPC],
      webSocket: [],
    },
  },
  blockExplorers: {
    default: { name: 'Basescan', url: 'https://basescan.org' },
  },
  contracts: {
    multicall3: {
      address: '0xca11bde05977b3631167028862be2a173976ca11',
      blockCreated: 5022,
    },
  },
};

const chains = [baseChain];

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Higher",
    chains,
    walletConnectProjectId: WALLETCONNECT_PROJECT_ID,
    transports: {
      [baseChain.id]: http(ALCHEMY_RPC)
    }
  })
);

function Web3ProviderInner({ children }) {
  const [factoryAddress, setFactoryAddress] = useState(null);

  useEffect(() => {
    getContractAddress().then(setFactoryAddress);
  }, []);

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
  