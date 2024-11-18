"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { motion } from "framer-motion";
import { useAccount, useConnect, useDisconnect, useEnsName } from "wagmi";
import { Button } from "./Button";

export function ConnectWalletButton() {
  const { connectors, connect, error } = useConnect();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });

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
      <MenuButton as={Button}>Connect Wallet</MenuButton>
      <MenuItems
        as={motion.div}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        anchor="bottom end"
        className="bg-black border border-green-600 flex-col p-2 grid grid-cols-[auto_1fr] mt-2"
      >
        {connectors.map((connector) => (
          <MenuItem key={connector.uid}>
            <Button
              onClick={() => connector.connect()}
              className="text-left gap-x-1 grid grid-cols-subgrid col-span-full items-center px-2 hover:bg-green-800 [data-focus]:bg-green-600"
            >
              {connector.icon ? (
                <img
                  src={connector.icon}
                  alt={connector.name}
                  className="w-5"
                />
              ) : (
                <div />
              )}
              <div className="text-white whitespace-nowrap p-2">
                {connector.name}
              </div>
            </Button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
