import { CapsuleEvmProvider, coinbaseWallet, metaMaskWallet, walletConnectWallet } from "@usecapsule/evm-wallet-connectors";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { base } from 'viem/chains';
import MainLayout from '@/layouts/MainLayout';
import '@/styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <CapsuleEvmProvider
      config={{
        projectId: "f6bd6e2911b56f5ac3bc8b2d0e2d7ad5",
        appName: "Higherrrrrrr",
        chains: [base],
        wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet],
      }}
    >
      <QueryClientProvider client={queryClient}>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </QueryClientProvider>
    </CapsuleEvmProvider>
  );
}