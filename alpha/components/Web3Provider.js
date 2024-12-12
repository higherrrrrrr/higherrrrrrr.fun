"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { 
  CapsuleEvmProvider, 
  metaMaskWallet, 
  coinbaseWallet,
  phantomWallet,
  walletConnectWallet 
} from "@usecapsule/evm-wallet-connectors";
import { base } from "viem/chains";
import { createContext, useContext, useState } from "react";
import { CapsuleModal, AuthLayout, ExternalWallet, OAuthMethod } from "@usecapsule/react-sdk";
import { capsuleClient } from "../client/capsule";

const queryClient = new QueryClient();

const ALCHEMY_RPC = 'https://rpc.higherrrrrrr.fun/';
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

// Create context for the connect modal
const ConnectModalContext = createContext({
  openConnectModal: () => {},
  closeConnectModal: () => {},
});

// Custom hook to use the connect modal
export const useConnectModal = () => useContext(ConnectModalContext);

export function Web3Provider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openConnectModal = () => setIsOpen(true);
  const closeConnectModal = () => setIsOpen(false);

  return (
    <QueryClientProvider client={queryClient}>
      <CapsuleEvmProvider
        config={{
          appName: "higherrrrrrr",
          chains: [baseChain],
          projectId: WALLETCONNECT_PROJECT_ID,
          ssr: false,
          transports: {
            [baseChain.id]: ALCHEMY_RPC,
          },
          wallets: [
            metaMaskWallet(),
            coinbaseWallet(),
            phantomWallet(),
            walletConnectWallet()
          ]
        }}
      >
        <ConnectModalContext.Provider value={{ openConnectModal, closeConnectModal }}>
          {children}
          <CapsuleModal
            capsule={capsuleClient}
            isOpen={isOpen}
            onClose={closeConnectModal}
            logo={"https://pbs.twimg.com/profile_images/1864470786381369345/GuAosjLh_400x400.png"}
            theme={{
              backgroundColor: "#000000",
              font: "Inter",
              borderRadius: "md",
              accentColor: "#4ade80",
              foregroundColor: "#4ade80"
            }}
            oAuthMethods={[OAuthMethod.GOOGLE, OAuthMethod.TWITTER, OAuthMethod.FARCASTER]}
            disableEmailLogin={false}
            disablePhoneLogin={false}
            authLayout={[AuthLayout.AUTH_FULL, AuthLayout.EXTERNAL_FULL]}
            externalWallets={[
              ExternalWallet.METAMASK,
              ExternalWallet.COINBASE,
              ExternalWallet.WALLETCONNECT,
              ExternalWallet.PHANTOM
            ]}
            twoFactorAuthEnabled={false}
            recoverySecretStepEnabled={true}
            onRampTestMode
          />
        </ConnectModalContext.Provider>
      </CapsuleEvmProvider>
    </QueryClientProvider>
  );
}

// Export a ConnectKitButton component that uses the modal
export function ConnectKitButton() {
  const { openConnectModal } = useConnectModal();

  return (
    <button
      onClick={openConnectModal}
      className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors"
    >
      Connect Wallet
    </button>
  );
}

// Export the chain config for use elsewhere
export const getCurrentChain = () => baseChain;
  