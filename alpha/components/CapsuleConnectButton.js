import { useState } from "react";
import { AuthLayout, CapsuleModal, ExternalWallet } from "@usecapsule/react-sdk";
import { capsuleClient } from "../client/capsule";
import { useCapsuleAccount } from "@usecapsule/react-sdk";

export function CapsuleConnectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { address } = useCapsuleAccount();

  // Format address for display
  const displayAddress = address 
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "Connect Wallet";

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-colors"
      >
        {displayAddress}
      </button>

      <CapsuleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        capsule={capsuleClient}
        appName="higherrrrrrr"
        authLayout={[AuthLayout.EXTERNAL_FULL]}
        externalWallets={[
          ExternalWallet.METAMASK,
          ExternalWallet.COINBASE,
          ExternalWallet.WALLETCONNECT,
        ]}
        disablePhoneLogin={true}
        disableEmailLogin={true}
        theme={{
          mode: "dark",
          darkBackgroundColor: "#09090b",
          darkForegroundColor: "#22c55e", 
          darkAccentColor: "#00ff00",
        }}
      />
    </>
  );
} 