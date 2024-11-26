import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Web3Provider } from '../components/Web3Provider';
import MainLayout from '../layouts/MainLayout';
import '../styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Web3Provider>
        <MainLayout>
          <Component {...pageProps} />
        </MainLayout>
      </Web3Provider>
    </QueryClientProvider>
  );
}
