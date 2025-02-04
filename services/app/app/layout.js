"use client";

import "../styles/globals.css"; // Import your global styles here
import DynamicProvider from "../components/DynamicProvider";
import MainLayout from "../layouts/MainLayout";
import { WagmiProvider, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'viem';

const config = createConfig({
  chains: [base],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Higherrrrrrr.fun</title>
        <link rel="icon" href="/icon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            {/* Wrap your entire application in the DynamicProvider */}
            <DynamicProvider>
              <MainLayout>{children}</MainLayout>
            </DynamicProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
