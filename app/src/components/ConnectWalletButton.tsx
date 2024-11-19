"use client";

import React, { useState } from "react";
import {
  CapsuleModal,
  AuthLayout,
  OAuthMethod,
  ExternalWallet,
} from "@usecapsule/react-sdk";
import capsule from "../app/capsule"
import "@usecapsule/react-sdk/styles.css";
import {
  CapsuleEvmProvider,
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet
} from "@usecapsule/evm-wallet-connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { motion } from "framer-motion";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { Button } from "./Button";

export function ConnectWalletButton() {
  const { connectors } = useConnect();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

  const [isOpen, setIsOpen] = useState(false);

  // const QUERY_CLIENT = new QueryClient();

  // Verify the instance is created successfully
  console.log("Capsule instance created:", capsule);

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
      <MenuButton as={Button} onClick={() => setIsOpen(true)}>Connect Wallet</MenuButton>
      <CapsuleEvmProvider
        config={{
          projectId: 'f6bd6e2911b56f5ac3bc8b2d0e2d7ad5',
          appName: "Higherrrrrrr",
          chains: ['sepolia'],
          wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
        }}>
          <CapsuleModal
            // logo={Logo}
            theme={{
              backgroundColor: "#1F1F1F",
              foregroundColor: "#FFF",
              accentColor: "#FF754A",
              mode: "dark",
              font: "Inter",
            }}
            capsule={capsule}
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            appName="Higherrrrrrr"
            oAuthMethods={[
              OAuthMethod.GOOGLE,
              OAuthMethod.TWITTER,
            ]}
            authLayout={[AuthLayout.EXTERNAL_FULL, AuthLayout.AUTH_CONDENSED]}
            externalWallets={[ExternalWallet.METAMASK, ExternalWallet.COINBASE, ExternalWallet.WALLETCONNECT]}
            twoFactorAuthEnabled={false}
            recoverySecretStepEnabled={false}
            // onRampTestMode={true}
          />
      </CapsuleEvmProvider>
    </Menu>
  );

  // return (
  //   <Menu>
  //     <MenuButton as={Button}>Connect Wallet</MenuButton>
  //     <MenuItems
  //       as={motion.div}
  //       initial={{ opacity: 0, y: 4 }}
  //       animate={{ opacity: 1, y: 0 }}
  //       exit={{ opacity: 0, y: 4 }}
  //       anchor="bottom end"
  //       className="bg-black border border-green-600 flex-col p-2 grid grid-cols-[auto_1fr] mt-2 min-w-[200px]"
  //     >
  //       {connectors.map((connector) => (
  //         <MenuItem key={connector.uid}>
  //           <button
  //             onClick={() => connector.connect()}
  //             className="text-left gap-x-1 grid grid-cols-subgrid col-span-full items-center px-2 hover:bg-green-800 [data-focus]:bg-green-600"
  //           >
  //             {connector.icon ? (
  //               // eslint-disable-next-line @next/next/no-img-element
  //               <img
  //                 src={connector.icon}
  //                 alt={connector.name}
  //                 className="w-5"
  //               />
  //             ) : (
  //               <div />
  //             )}
  //             <div className="text-white whitespace-nowrap p-2">
  //               {connector.name}
  //             </div>
  //           </button>
  //         </MenuItem>
  //       ))}
  //     </MenuItems>
  //   </Menu>
  // );

}
