import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import '@usecapsule/react-sdk/styles.css';

// Dynamically import components with SSR disabled
const Web3Provider = dynamic(
  () => import('../components/Web3Provider').then(mod => mod.Web3Provider),
  { ssr: false }
);

const MainLayout = dynamic(
  () => import('../layouts/MainLayout'),
  { ssr: false }
);

const Launch = dynamic(
  () => import('./launch'),
  { ssr: false }
);

const queryClient = new QueryClient();

// PostHog initialization
if (typeof window !== 'undefined') {
  posthog.init('phc_QObbSAeS9Bc3rBhOtDD0M5JUp5RDmPDQZVsmNQVXnFp', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
  });
}

function App({ Component, pageProps }) {
  const router = useRouter();
  
  useEffect(() => {
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

// Use noSSR wrapper
export default dynamic(() => Promise.resolve(App), {
  ssr: false
});
