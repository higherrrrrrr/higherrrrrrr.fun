// components/WagmiProvider.tsx
"use client";

import { createConfig, Chain, WagmiConfig, type CreateConfigParameters } from "wagmi";
import { createPublicClient, http } from "viem";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


// Define Base chain
export const base: Chain = {
  id: 8453,
  name: "Base",
  network: "base",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
    public: { http: ["https://mainnet.base.org"] },
  },
};

import { capsuleConnector } from "@usecapsule/wagmi-v2-integration";
import capsule from "./capsule";

// Create Capsule connector
const connector = capsuleConnector({
  capsule: capsule,
  chains: [base], // Add your supported chains
  appName: "Higherrrrrrr",
  options: {},
});

// Configure Wagmi
const config: CreateConfigParameters = {
  chains: [base],
  connectors: [connector],
  transports: [http("https://mainnet.base.org")],
  ssr: true,
};

const wagmiConfig = createConfig(config);

const queryClient = new QueryClient();

export function WagmiProvider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiConfig>
  );
}
