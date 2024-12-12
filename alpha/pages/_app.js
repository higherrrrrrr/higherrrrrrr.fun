import { CapsuleProvider } from '../providers/CapsuleProvider';
import MainLayout from '../layouts/MainLayout';
import '@usecapsule/react-sdk/styles.css';
import '../styles/globals.css';
import { useEffect } from 'react';
import posthog from 'posthog-js';
import { useRouter } from 'next/router';

// PostHog initialization
if (typeof window !== 'undefined') {
  posthog.init('phc_QObbSAeS9Bc3rBhOtDD0M5JUp5RDmPDQZVsmNQVXnFp', {
    api_host: 'https://us.i.posthog.com',
    person_profiles: 'always',
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

  return (
    <CapsuleProvider>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </CapsuleProvider>
  );
}
