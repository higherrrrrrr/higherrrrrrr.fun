import { Web3Provider } from '../components/Web3Provider';
import MainLayout from '../layouts/MainLayout';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <Web3Provider>
      <MainLayout>
        <Component {...pageProps} />
      </MainLayout>
    </Web3Provider>
  );
}

export default MyApp;