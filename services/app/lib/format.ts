export function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
  return num.toFixed(2);
}

export function formatPriceChange(change: number): string {
  return (change >= 0 ? '+' : '') + change.toFixed(2) + '%';
}

export function getPriceChangeColor(change: number): string {
  return change > 0 ? 'text-green-500' : 
         change < 0 ? 'text-red-500' : 
         'text-gray-500';
} 