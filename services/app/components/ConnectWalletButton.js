import { useState } from "react";
import {
  AuthLayout,
  CapsuleModal,
  ExternalWallet,
} from "@usecapsule/react-sdk";
import "@usecapsule/react-sdk/styles.css";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { motion } from "framer-motion";
import { useAccount, useDisconnect, useEnsName } from "wagmi";
import { ConnectButton as DefaultConnectButton } from '@rainbow-me/rainbowkit';

// Base button component with consistent styling
export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`
        w-full h-12 px-4 bg-green-500 hover:bg-green-400 text-black font-mono 
        font-bold rounded transition-all duration-200 whitespace-nowrap text-base
        flex items-center justify-center
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}

export function ConnectWalletButton() {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const [isOpen, setIsOpen] = useState(false);

  if (address) {
    return (
      <Menu>
        <MenuButton as={Button}>
          {ensName
            ? `${ensName}`
            : `${address.slice(0, 6)}...${address.slice(-4)}`}
        </MenuButton>
        <MenuItems
          as={motion.div}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="absolute right-0 mt-2 w-[180px] bg-black border border-green-500/20 rounded p-2 z-50"
        >
          <MenuItem>
            <button
              onClick={() => disconnect()}
              className="w-full text-left px-2 py-1 hover:bg-green-500/10 text-green-500 font-mono text-sm"
            >
              Disconnect
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
    );
  }

  return (
    <Menu>
      <MenuButton as={Button} onClick={() => setIsOpen(true)}>
        Connect Wallet
      </MenuButton>

      <CapsuleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appName="Higherrrrrrr"
        oAuthMethods={[]}
        disablePhoneLogin={true}
        disableEmailLogin={true}
        authLayout={[AuthLayout.EXTERNAL_FULL]}
        theme={{
          mode: "dark",
          darkBackgroundColor: "#09090b",
          darkForegroundColor: "#22c55e",
          darkAccentColor: "#00ff00",
        }}
        externalWallets={[
          ExternalWallet.METAMASK,
          ExternalWallet.COINBASE,
          ExternalWallet.WALLETCONNECT,
        ]}
      />
    </Menu>
  );
}

export function ConnectKitButton() {
  return (
    <DefaultConnectButton.Custom>
      {({ isConnected, show, truncatedAddress, ensName }) => {
        return (
          <button
            onClick={show}
            className="w-full h-12 px-4 bg-green-500 hover:bg-green-400 text-black font-mono font-bold rounded transition-all duration-200 whitespace-nowrap text-base flex items-center justify-center"
          >
            {isConnected ? (ensName ?? truncatedAddress) : "Connect Wallet"}
          </button>
        );
      }}
    </DefaultConnectButton.Custom>
  );
}