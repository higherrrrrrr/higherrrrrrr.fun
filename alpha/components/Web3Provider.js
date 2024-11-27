import { WagmiConfig, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { ConnectKitProvider, ConnectKitButton as DefaultConnectButton, getDefaultConfig } from 'connectkit';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';
import { http } from 'viem';

export const FactoryContext = createContext(null);
export const useFactory = () => useContext(FactoryContext);

const ALCHEMY_RPC = 'https://base-mainnet.g.alchemy.com/v2/l0XzuD715Z-zd21ie5dbpLKrptTuq07a';

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

// Always use Base mainnet through Alchemy
const chains = [baseChain];

const wagmiConfig = createConfig(
  getDefaultConfig({
    appName: "Higherrrrrrr",
    chains,
    transports: {
      [baseChain.id]: http(ALCHEMY_RPC),
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
export const getCurrentChain = () => baseChain; 