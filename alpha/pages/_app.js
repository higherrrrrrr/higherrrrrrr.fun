import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Web3Provider } from '../components/Web3Provider';
import MainLayout from '../layouts/MainLayout';
import '../styles/globals.css';
import Launch from './launch';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
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
