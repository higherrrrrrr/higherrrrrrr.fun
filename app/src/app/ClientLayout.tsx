"use client";

import { Button } from "@/components/Button";
import { ConnectWalletButton } from "@/components/ConnectWalletButton";
import { EthPriceProvider } from "@/components/EthPriceProvider";
import { TypeAndDelete } from "@/components/TypeAndDelete";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Link from "next/link";
import { PropsWithChildren } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";

import { base } from "wagmi/chains";

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  ssr: true,
});

const queryClient = new QueryClient();

export function ClientLayout({ children }: PropsWithChildren) {
  return (
    <WagmiProvider config={config}>
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
