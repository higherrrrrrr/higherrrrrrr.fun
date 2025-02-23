import dynamic from 'next/dynamic';

const DynamicTradeForm = dynamic(() => import('./TradeForm'), {
  loading: () => <LoadingSpinner />,
  ssr: false
}); 