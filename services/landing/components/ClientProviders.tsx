import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CapsuleEvmProvider } from "@usecapsule/evm-wallet-connectors";
import { metaMaskWallet, coinbaseWallet, walletConnectWallet } from "@usecapsule/evm-wallet-connectors";
import { base } from "wagmi/chains";
import { PropsWithChildren, useState } from "react";

export function ClientProviders({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <CapsuleEvmProvider
        config={{
          projectId: "f6bd6e2911b56f5ac3bc8b2d0e2d7ad5",
          appName: "Higherrrrrrr",
          chains: [base],
          wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
        }}>
        {children}
      </CapsuleEvmProvider>
    </QueryClientProvider>
  );
}
