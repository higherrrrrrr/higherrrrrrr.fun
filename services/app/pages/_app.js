import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Web3Provider } from '../components/Web3Provider';
import MainLayout from '../layouts/MainLayout';
import '../styles/globals.css';
import Launch from './launch';
import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useRouter } from 'next/router';

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
      <Web3Provider>
        <MainLayout>
          <ShowComponent {...pageProps} />
        </MainLayout>
      </Web3Provider>
    </QueryClientProvider>
  );
}
