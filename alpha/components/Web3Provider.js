import { WagmiConfig, createConfig, useAccount } from 'wagmi';
import { base } from 'viem/chains';
import { useEffect, useState, createContext, useContext } from 'react';
import { getContractAddress } from '../api/contract';
import { http, createWalletClient, custom } from 'viem';
import { injected } from 'wagmi/connectors';
import dynamic from 'next/dynamic';
import evmWalletConnectors from '@usecapsule/evm-wallet-connectors';
import { switchChain } from 'wagmi/actions';
import Capsule, { Environment, CapsuleModal } from "@usecapsule/react-sdk";

// Import styles in _app.js instead
export const FactoryContext = createContext(null);
export const useFactory = () => useContext(FactoryContext);

const ALCHEMY_RPC = 'https://rpc.higherrrrrrr.fun/';
const CAPSULE_API_KEY = '196c6fd5269e56bdcca8929272bf1e9c';

// Initialize Capsule directly
const capsule = new Capsule(Environment.PROD, CAPSULE_API_KEY, {
  evmWalletConnectors
});

// Base chain config remains the same
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

// Updated wagmi config for v2
const wagmiConfig = createConfig({
  chains: [baseChain],
  transports: {
    [baseChain.id]: http(ALCHEMY_RPC)
  },
  connectors: [
    injected({
      target: 'metaMask'
    })
  ]
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
      <Web3ProviderInner>{children}</Web3ProviderInner>
    </WagmiConfig>
  );
}

export function ConnectKitButton() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors"
      >
        Connect Wallet
      </button>
      <CapsuleModal
        capsule={capsule}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        logo={"https://pbs.twimg.com/profile_images/1864470786381369345/GuAosjLh_400x400.png"}
        theme={{
          backgroundColor: "#000000",
          font: "Inter",
          borderRadius: "md",
          accentColor: "#4ade80",
          foregroundColor: "#4ade80"
        }}
        oAuthMethods={["GOOGLE", "TWITTER", "FARCASTER"]}
        disableEmailLogin={false}
        disablePhoneLogin={false}
        authLayout={["AUTH:FULL", "EXTERNAL:FULL"]}
        externalWallets={["METAMASK", "COINBASE", "WALLETCONNECT", "PHANTOM"]}
        twoFactorAuthEnabled={false}
        recoverySecretStepEnabled={true}
        onRampTestMode
      />
    </>
  );
}

export const getCurrentChain = () => baseChain;
  