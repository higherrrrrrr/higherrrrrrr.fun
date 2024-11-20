"use client";

import React, { useState } from "react";
import {
  CapsuleModal,
  AuthLayout,
  OAuthMethod,
  ExternalWallet,
} from "@usecapsule/react-sdk";
import capsule from "../app/capsule";
import "@usecapsule/react-sdk/styles.css";
import {
  CapsuleEvmProvider,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
} from "@usecapsule/evm-wallet-connectors";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { motion } from "framer-motion";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { base } from "wagmi/chains";
import { Button } from "./Button";

export function ConnectWalletButton() {
  const { connectors } = useConnect();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

  const [isOpen, setIsOpen] = useState(false);

  if (address) {
    return (
      <Menu>
        <MenuButton className="py-2 min-w-[200px] border border-green-600">
          {ensName
            ? `${ensName}`
            : `${address.slice(0, 6)}...${address.slice(-4)}`}
        </MenuButton>
        <MenuItems
          as={motion.div}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          anchor="bottom end"
          className="bg-black border border-green-600 flex-col p-2 grid grid-cols-[auto_1fr] mt-2 min-w-[200px]"
        >
          <MenuItem>
            <Button
              onClick={() => {
                disconnect();
                location.reload();
              }}
              className="text-left gap-x-1 grid grid-cols-subgrid col-span-full items-center px-2 hover:bg-green-800 [data-focus]:bg-green-600 text-white"
            >
              Disconnect
            </Button>
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
        capsule={capsule}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        appName="Higherrrrrrr"
        oAuthMethods={[]}
        disablePhoneLogin={true}
        disableEmailLogin={true}
        authLayout={[AuthLayout.EXTERNAL_FULL]}
        externalWallets={[
          ExternalWallet.METAMASK,
          ExternalWallet.COINBASE,
          ExternalWallet.WALLETCONNECT,
        ]}
      />
    </Menu>
  );
}
