import { AppProps } from "next/app";
import dynamic from "next/dynamic";
import "../styles/globals.css";

const ClientProviders = dynamic(() => import("../components/ClientProviders").then((mod) => mod.ClientProviders), {
  ssr: false,
});

// Wrap the App pages with the ClientProviders so that wagmi configs are available through different pages.
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientProviders>
      <Component {...pageProps} />
    </ClientProviders>
  );
}

export default MyApp;
