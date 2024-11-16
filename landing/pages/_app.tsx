// pages/_app.tsx
'use client'

import { WagmiConfig, createConfig, Chain } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';
import '../styles/globals.css';

// Define Base chain
const base: Chain = {
    id: 8453,
    name: 'Base',
    network: 'base',
    nativeCurrency: {
        decimals: 18,
        name: 'Ethereum',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: { http: ['https://mainnet.base.org'] },
        public: { http: ['https://mainnet.base.org'] },
    },
};

const config = createConfig({
    chains: [base],
    connectors: [
        injected({
            shimDisconnect: true,
        })
    ],
    client: createPublicClient({
        chain: base,
        transport: http('https://mainnet.base.org')
    }),
});

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }) {
    return (
        <WagmiConfig config={config}>
            <QueryClientProvider client={queryClient}>
                <Component {...pageProps} />
            </QueryClientProvider>
        </WagmiConfig>
    );
}

export default MyApp;