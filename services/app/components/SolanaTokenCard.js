import Link from 'next/link';

export function SolanaTokenCard({ token, category }) {
  // Format numbers with commas and fixed decimal places
  const formatNumber = (num, decimals = 2) => {
    if (!num) return '0';
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Format volume to K/M/B
  const formatVolume = (volume) => {
    if (!volume) return '$0';
    const num = parseFloat(volume);
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Format date to relative time
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays/30)}mo ago`;
    return `${Math.floor(diffDays/365)}y ago`;
  };

  return (
    <Link 
      href={`https://ape.pro/solana/${token.token_address}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-green-500/20 bg-black hover:border-green-500/40 transition-colors"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-bold text-green-500">
            {token.name || 'Unknown Token'}
          </h3>
          <p className="text-sm text-green-500/70">
            {token.symbol}
            {category && (
              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-green-500/10">
                {category}
              </span>
            )}
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono font-bold text-green-400">
            {formatVolume(token.volume_24h)}
          </div>
          <div className="text-xs text-green-500/50">
            24h Volume
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-green-500/50">Trades (24h)</div>
          <div className="font-mono text-green-400">
            {formatNumber(token.trades_24h, 0)}
          </div>
        </div>
        <div>
          <div className="text-green-500/50">Holders</div>
          <div className="font-mono text-green-400">
            {formatNumber(token.total_accounts, 0)}
          </div>
        </div>
        <div>
          <div className="text-green-500/50">Created</div>
          <div className="font-mono text-green-400">
            {formatDate(token.created_at)}
          </div>
        </div>
      </div>
    </Link>
  );
} 