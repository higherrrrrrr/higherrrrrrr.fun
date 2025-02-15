import Link from 'next/link';

// Loading skeleton
const TokenCardSkeleton = () => (
  <div className="block p-6 border border-green-500/20 rounded-lg animate-pulse">
    <div className="flex items-start space-x-4">
      <div className="w-12 h-12 bg-green-500/20 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="h-7 bg-green-500/20 w-32 rounded mb-2" />
      </div>
    </div>
  </div>
);

export default function TokenCard({ token, isLoading }) {
  if (isLoading || !token) {
    return <TokenCardSkeleton />;
  }

  const dexScreenerUrl = `https://dexscreener.com/base/${token.address}`;

  return (
    <Link
      href={dexScreenerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-6 border border-green-500/20 rounded-lg hover:border-green-500/40 transition-colors hover:bg-green-500/5"
    >
      <div className="flex items-start space-x-4">
        <div className="flex-1 min-w-0">
          <p className="text-2xl font-mono text-green-500 mb-1 truncate">
            {token.symbol || 'Loading...'}
          </p>
          <div className="text-xs text-green-500/40">
            View on DexScreener →
          </div>
        </div>
      </div>
    </Link>
  );
} 