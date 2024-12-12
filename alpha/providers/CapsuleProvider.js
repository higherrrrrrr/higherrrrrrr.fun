import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CapsuleEvmProvider } from "@usecapsule/evm-wallet-connectors";
import { base } from "viem/chains";

const queryClient = new QueryClient();

export function CapsuleProvider({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CapsuleEvmProvider
        config={{
          appName: "higherrrrrrr",
          chains: [base],
          projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
          ssr: false,
        }}
      >
        {children}
      </CapsuleEvmProvider>
    </QueryClientProvider>
  );
} 