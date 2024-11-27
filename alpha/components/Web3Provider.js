import { WagmiConfig, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { ConnectKitProvider, ConnectKitButton as DefaultConnectButton, getDefaultConfig } from 'connectkit';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';
import { http } from 'viem';

export const FactoryContext = createContext(null);
export const useFactory = () => useContext(FactoryContext);

const ALCHEMY_RPC = 'https://base-mainnet.g.alchemy.com/v2/l0XzuD715Z-zd21ie5dbpLKrptTuq07a';

// Define Anvil chain as a fork of Base
const anvil = {
  ...base,
  id: 31337,
  name: 'Local Base Fork',
  network: 'base',
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['http://127.0.0.1:8545'] },
    public: { http: ['http://127.0.0.1:8545'] },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 0
    }
  }
};

// Override Base chain RPC
const baseChain = {
  ...base,
  rpcUrls: {
    ...base.rpcUrls,
    default: { http: [ALCHEMY_RPC] },
    public: { http: [ALCHEMY_RPC] },
  }
};

// Create initial config
const isLocal = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const chains = [isLocal ? anvil : baseChain];

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Higherrrrrrr",
    chains,
    transports: {
      [base.id]: http(ALCHEMY_RPC),
      [anvil.id]: http('http://127.0.0.1:8545'),
    },
  }),
);

function Web3ProviderInner({ children }) {
  const [factoryAddress, setFactoryAddress] = useState(null);

  useEffect(() => {
    async function init() {
      try {
        const { factory_address } = await getContractAddress();
        console.log('Factory address:', factory_address);
        setFactoryAddress(factory_address);
      } catch (error) {
        console.error('Failed to initialize Web3Provider:', error);
      }
    }

    init();
  }, []);

  if (!factoryAddress) {
    return (
      <div className="min-h-screen bg-black">
        {children}
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
      >
        <Web3ProviderInner>{children}</Web3ProviderInner>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export function ConnectKitButton() {
  return <DefaultConnectButton />;
}

// Export the current chain for use elsewhere in the app
export const getCurrentChain = () => {
  const isLocal = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  return isLocal ? anvil : baseChain;
}; 