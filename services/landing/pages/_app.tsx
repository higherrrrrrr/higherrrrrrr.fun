import { AppProps } from "next/app";
import dynamic from "next/dynamic";
import "../styles/globals.css";

const ClientProviders = dynamic(() => import("../components/ClientProviders").then((mod) => mod.ClientProviders), {
  ssr: false,
});

function AnnouncementBanner() {
  return (
    <div className="bg-green-500 p-2 text-center font-medium">
      🚀 Our alpha is launching at <a href="https://alpha.higherrrrrrr.fun" className="underline hover:opacity-80">alpha.higherrrrrrr.fun</a>
    </div>
  );
}

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ClientProviders>
      <AnnouncementBanner />
      <Component {...pageProps} />
    </ClientProviders>
  );
}

export default MyApp;
