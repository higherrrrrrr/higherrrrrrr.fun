import { useState, useEffect } from "react";
import {
  AuthLayout,
  CapsuleModal,
  ExternalWallet,
} from "@usecapsule/react-sdk";
import "@usecapsule/react-sdk/styles.css";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { motion } from "framer-motion";
import { useAccount, useDisconnect, useEnsName } from "wagmi";

// Button component for consistency
export function Button({ children, className = "", ...props }) {
  return (
    <button
      className={`min-w-[200px] border border-green-600 hover:bg-green-600 hover:text-black py-2 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function ConnectWalletButton() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const [isOpen, setIsOpen] = useState(false);

  // Add polling effect
  useEffect(() => {
    const checkWallet = setInterval(() => {
      const ethereum = window?.ethereum;
      if (ethereum) {
        ethereum.request({ method: 'eth_accounts' })
          .then(accounts => {
            if (accounts.length > 0 && isOpen) {
              setIsOpen(false);
            }
          })
          .catch(console.error);
      }
    }, 100);

    return () => clearInterval(checkWallet);
  }, [isOpen]);

  console.log('Wallet state:', { address, isConnected, ensName });

  if (isConnected && address) {
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
          className="absolute right-0 mt-2 min-w-[200px] bg-black border border-green-600 p-2"
        >
          <MenuItem>
            <button
              onClick={() => disconnect()}
              className="w-full text-left px-2 py-1 hover:bg-green-800 text-white"
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
        Sign In
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