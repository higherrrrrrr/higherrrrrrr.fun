import dynamic from 'next/dynamic';

const DynamicRetailPage = dynamic(
  () => import('../../components/retail/RetailPage'),
  { ssr: false }
);

export default function RetailPage() {
  return <DynamicRetailPage />;
} 