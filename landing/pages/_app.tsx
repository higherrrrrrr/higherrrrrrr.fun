// pages/_app.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getDefaultConfig } from "connectkit";
import { WagmiProvider, createConfig } from "wagmi";
import { base } from "wagmi/chains";
import "../styles/globals.css";

const config = createConfig(
  getDefaultConfig({
    chains: [base],
    appName: "Higherrrrrrr",
    walletConnectProjectId: "higherrrrrrr",
  })
);

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default MyApp;
