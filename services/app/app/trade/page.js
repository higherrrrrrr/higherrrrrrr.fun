import dynamic from 'next/dynamic';

const DynamicTradePage = dynamic(
  () => import('../../components/trade/TradePage'),
  { ssr: false }
);

export default function TradePage() {
  return <DynamicTradePage />;
} 