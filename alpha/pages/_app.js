import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import MainLayout from '../layouts/MainLayout';
import '../styles/globals.css';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </QueryClientProvider>
  );
}
