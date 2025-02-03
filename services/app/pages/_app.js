import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainLayout from '../layouts/MainLayout';
import '../styles/globals.css';
import Launch from './launch';
import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useRouter } from 'next/router';

// Import Dynamic Wallet components
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';
import { DynamicWagmiConnector } from '@dynamic-labs/wagmi-connector';
import { SolanaExtension } from '@dynamic-labs/solana-extension';
import { EthereumWalletConnectors } from "@dynamic-labs/ethereum";

const queryClient = new QueryClient();

// PostHog initialization
if (typeof window !== 'undefined') {
  posthog.init('phc_QObbSAeS9Bc3rBhOtDD0M5JUp5RDmPDQZVsmNQVXnFp', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        posthog.debug();
      }
      // Force reload feature flags
      posthog.reloadFeatureFlags();
    }
  });
}

// Define aggressive CSS overrides
const cssOverrides = `
  .dynamic-shadow-dom {
    --dynamic-connect-button-background: #22c55e !important;
    --dynamic-connect-button-color: black !important;
    --dynamic-connect-button-border: none !important;
    --dynamic-connect-button-shadow: none !important;
    --dynamic-connect-button-background-hover: #22c55e !important;
    --dynamic-connect-button-color-hover: black !important;
    --dynamic-connect-button-border-hover: none !important;
    --dynamic-connect-button-shadow-hover: none !important;
    --dynamic-connect-button-radius: 0.5rem !important;
    --dynamic-font-family-primary: monospace !important;
    --dynamic-text-size-button-primary: 1rem !important;
  }

  .dynamic-connect-button__button {
    background-color: #22c55e !important;
    color: black !important;
    font-family: monospace !important;
    font-weight: bold !important;
    font-size: 1rem !important;
    border-radius: 0.5rem !important;
    height: 48px !important;
    width: 100% !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    padding: 0.75rem !important;
    transition: all 0.2s !important;
    border: none !important;
    box-shadow: none !important;
  }

  .dynamic-connect-button__text {
    color: black !important;
    font-family: monospace !important;
    font-weight: bold !important;
    font-size: 1rem !important;
    opacity: 1 !important;
    visibility: visible !important;
  }
`;

export default function App({ Component, pageProps }) {
  const router = useRouter();
  
  useEffect(() => {
    // Track page views
    const handleRouteChange = () => {
      posthog.capture('$pageview');
    };

    router.events.on('routeChangeComplete', handleRouteChange);

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
  }, [router.events]);

  // If we're on the index page, show Launch instead
  const ShowComponent = Component.name === 'TokensList' ? Launch : Component;

  return (
    <QueryClientProvider client={queryClient}>
      <DynamicContextProvider
        settings={{
          environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID,
          cssOverrides,
          walletConnectors: [EthereumWalletConnectors],
          extensions: [SolanaExtension()],
          disableEmailLogin: true,
          disablePhoneLogin: true,
          oAuthMethods: [],
          buttonClassName: "dynamic-connect-button__button",
          buttonTextClassName: "dynamic-connect-button__text",
          displaySiweScreen: false,
          shadowDOMEnabled: false,
          walletConnectorExtensions: [],
        }}
        theme="dark"
      >
        <DynamicWagmiConnector>
          <MainLayout>
            <ShowComponent {...pageProps} />
          </MainLayout>
        </DynamicWagmiConnector>
      </DynamicContextProvider>
    </QueryClientProvider>
  );
}
