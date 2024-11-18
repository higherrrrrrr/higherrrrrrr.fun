import { Menu, MenuButton, MenuItems, MenuItem } from "@headlessui/react";
import { motion } from "framer-motion";
import * as React from "react";
import {
  Connector,
  useAccount,
  useConnect,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
} from "wagmi";

export function ConnectWalletButton() {
  const { connectors, connect, error } = useConnect();
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  console.log(error);
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
            <button
              onClick={() => {
                disconnect();
                location.reload();
              }}
              className="text-left gap-x-1 grid grid-cols-subgrid col-span-full items-center px-2 hover:bg-green-800 [data-focus]:bg-green-600 text-white"
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
      <MenuButton className="py-2 min-w-[200px] border border-green-600">
        Connect Wallet
      </MenuButton>
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
            <button
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
            </button>
          </MenuItem>
        ))}
      </MenuItems>
    </Menu>
  );
}
