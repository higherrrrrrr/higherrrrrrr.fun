import { WagmiConfig, createConfig, configureChains } from 'wagmi';
import { base } from 'wagmi/chains';
import { publicProvider } from 'wagmi/providers/public';
import { alchemyProvider } from 'wagmi/providers/alchemy';
import { ConnectKitProvider, ConnectKitButton as DefaultConnectButton } from 'connectkit';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';

export const FactoryContext = createContext(null);
export const useFactory = () => useContext(FactoryContext);

function Web3ProviderInner({ children }) {
  const [config, setConfig] = useState(null);
  const [factoryAddress, setFactoryAddress] = useState(null);

  useEffect(() => {
    async function init() {
      const { factory_address } = await getContractAddress();
      console.log('Factory address:', factory_address);
      setFactoryAddress(factory_address);

      // Configure chain with Base only
      const { publicClient, webSocketPublicClient } = configureChains(
        [base],
        [
          alchemyProvider({ apiKey: 'l0XzuD715Z-zd21ie5dbpLKrptTuq07a' }),
          publicProvider()
        ]
      );

      // Create wagmi config
      const wagmiConfig = createConfig({
        autoConnect: true,
        publicClient,
        webSocketPublicClient,
      });

      setConfig(wagmiConfig);
    }

    init().catch(console.error);
  }, []);

  if (!config || !factoryAddress) {
    return null;
  }

  return (
    <WagmiConfig config={config}>
      <ConnectKitProvider
        customTheme={{
          "--ck-font-family": "monospace",
          "--ck-accent-color": "#22c55e",
          "--ck-accent-text-color": "#000000",
        }}
        options={{
          hideBalance: false,
          hideNetwork: false,
          walletConnectName: 'WalletConnect',
        }}
      >
        <FactoryContext.Provider value={factoryAddress}>
          {children}
        </FactoryContext.Provider>
      </ConnectKitProvider>
    </WagmiConfig>
  );
}

export function Web3Provider({ children }) {
  return <Web3ProviderInner>{children}</Web3ProviderInner>;
}

export function ConnectKitButton() {
  return <DefaultConnectButton />;
}

// Export the current chain for use elsewhere in the app
export const getCurrentChain = () => base; 