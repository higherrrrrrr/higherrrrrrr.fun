import { createContext, useContext, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  CapsuleEvmProvider,
  coinbaseWallet,
  metaMaskWallet,
  rainbowWallet,
  walletConnectWallet,
  zerionWallet,
} from "@usecapsule/evm-wallet-connectors";
import { rabbyWallet } from "./RabbyWallet";
import { base } from "viem/chains";
import { CapsuleModal, AuthLayout, ExternalWallet } from "@usecapsule/react-sdk";
import { capsuleClient } from "../client/capsule";
import { useAccount, http } from "wagmi";

const CapsuleContext = createContext();
const queryClient = new QueryClient();

const ALCHEMY_RPC = "https://rpc.higherrrrrrr.fun/";

const baseChain = {
  ...base,
  rpcUrls: {
    default: { http: [ALCHEMY_RPC], webSocket: [] },
    public: { http: [ALCHEMY_RPC], webSocket: [] },
    alchemy: { http: [ALCHEMY_RPC], webSocket: [] },
  },
};

export function useCapsule() {
  const context = useContext(CapsuleContext);
  if (!context) {
    throw new Error("useCapsule must be used within Web3Provider");
  }
  return context;
}

export function ConnectCapsuleButton() {
  const { openModal } = useCapsule();
  const { address, isConnected } = useAccount();

  if (isConnected && address) {
    return (
      <button
        onClick={openModal}
        className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors"
      >
        {`${address.slice(0, 6)}...${address.slice(-4)}`}
      </button>
    );
  }

  return (
    <button
      onClick={openModal}
      className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors">
      Sign In
    </button>
  );
}

function Web3Provider({ children }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const value = {
    isModalOpen,
    openModal,
    closeModal,
  };

  return (
    <CapsuleContext.Provider value={value}>
      <QueryClientProvider client={queryClient}>
        <CapsuleEvmProvider
          config={{
            appName: "Higherrrrrrr",
            appDescription: "Launch tokens that evolve and grow with their community.",
            appIcon: "https://pbs.twimg.com/profile_images/1864470786381369345/GuAosjLh_400x400.png",
            appUrl: "https://alpha.higherrrrrrr.fun/",
            chains: [baseChain],
            projectId: "a893723ca57a205513119f91ba5c09c8",
            ssr: false,
            transports: {
              [baseChain.id]: http(ALCHEMY_RPC),
            },
            wallets: [
              metaMaskWallet,
              coinbaseWallet,
              rainbowWallet,
              walletConnectWallet,
              zerionWallet,
              rabbyWallet,
            ],
          }}
        >
          {children}
          <CapsuleModal
            capsule={capsuleClient}
            appName="Higherrrrrrr"
            isOpen={isModalOpen}
            onClose={closeModal}
            logo={"https://pbs.twimg.com/profile_images/1864470786381369345/GuAosjLh_400x400.png"}
            theme={{
              mode: "dark",
              backgroundColor: "#010101",
              font: "Inter",
              borderRadius: "md",
              accentColor: "#4ade80",
              foregroundColor: "#4ade80",
            }}
            oAuthMethods={["GOOGLE","TWITTER","FARCASTER"]}
            disableEmailLogin={false}
            disablePhoneLogin={false}
            authLayout={["AUTH:FULL","EXTERNAL:FULL"]}
            externalWallets={[
              ExternalWallet.METAMASK,
              ExternalWallet.COINBASE,
              ExternalWallet.WALLETCONNECT,
              ExternalWallet.RAINBOW,
              ExternalWallet.ZERION,
              ExternalWallet.RABBY,
            ]}
            twoFactorAuthEnabled={false}
            recoverySecretStepEnabled={true}
            onRampTestMode
          />
        </CapsuleEvmProvider>
      </QueryClientProvider>
    </CapsuleContext.Provider>
  );
}

// Export the chain config for use elsewhere
export const getCurrentChain = () => baseChain;

export default Web3Provider;
