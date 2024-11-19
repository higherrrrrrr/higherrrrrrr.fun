"use client";

import { Button } from "@/components/Button";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { EthPriceProvider } from "@/components/EthPriceProvider";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { createConfig, WagmiProvider, http, type CreateConfigParameters } from "wagmi";

import { base } from "wagmi/chains";


import { capsuleConnector } from "@usecapsule/wagmi-v2-integration";
import capsule from "./capsule"; // Your Capsule client initialization

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
  transports: {
    [base.id]: http(),
  },
  ssr: true,
};

const wagmiConfig = createConfig(config);
const queryClient = new QueryClient();

export function ClientLayout({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <EthPriceProvider>
          <div className="bg-black min-h-screen w-full text-white font-mono flex flex-col">
            <Header />
            {children}
          </div>
        </EthPriceProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function Header() {
  return (
    <div className="flex justify-between p-6 items-center">
      <Link href="/" className="text-xl font-bold">
        highe
        <span className="text-green-600">
          <TypeAndDelete words={["rrrrrrrrrrrrrrr"]} />
        </span>
      </Link>

      <div className="flex gap-x-4">
        <Link href="/new-token">
          <Button>+ New Coin</Button>
        </Link>

        <ConnectWalletButton />
      </div>
    </div>
  );
}
