import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useRouter } from "next/router";
import posthog from "posthog-js";
import "../styles/globals.css";
import "@usecapsule/react-sdk/styles.css";
import Launch from './launch';
const Web3Provider = dynamic(() => import("../components/Web3Provider"), {
  ssr: false,
});
const MainLayout = dynamic(() => import("../layouts/MainLayout"), {
  ssr: false,
});

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

    // If we're on the index page, show Launch instead
    const ShowComponent = Component.name === 'TokensList' ? Launch : Component;

  return (
    <Web3Provider>
      <MainLayout>
        <ShowComponent {...pageProps} />
      </MainLayout>
    </Web3Provider>
  );
}
