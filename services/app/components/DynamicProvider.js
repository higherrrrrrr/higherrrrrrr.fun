"use client";

import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";
import { SolanaWalletConnectors } from "@dynamic-labs/solana";
import { DYNAMIC_CONFIG } from '../config/dynamic';

const DynamicProvider = ({ children }) => {
  return (
    <DynamicContextProvider
      settings={{
        ...DYNAMIC_CONFIG,
        theme: 'dark',
        walletConnectors: [
          SolanaWalletConnectors,
        ],
        network: 'mainnet',
        solanaConfig: {
          rpcUrl: "https://netti-iof1ud-fast-mainnet.helius-rpc.com",
          network: 'mainnet'
        }
      }}
    >
      {children}
    </DynamicContextProvider>
  );
};

export default DynamicProvider;
