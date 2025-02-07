/**
 * Formats a USD price with appropriate decimal places
 * @param {number} price - The price to format
 * @returns {string} - The formatted price
 */
export function formatUsdPrice(price) {
  if (price < 0.000001) return price.toExponential(2);
  if (price < 0.01) return price.toFixed(6);
  if (price < 1) return price.toFixed(4);
  return price.toFixed(2);
}

/**
 * Formats a market cap value with appropriate suffix (K, M, B)
 * @param {number} cap - The market cap value to format
 * @returns {string} - The formatted market cap
 */
export function formatMarketCap(cap) {
  if (cap >= 1_000_000_000) return `$${(cap / 1_000_000_000).toFixed(2)}B`;
  if (cap >= 1_000_000) return `$${(cap / 1_000_000).toFixed(2)}M`;
  if (cap >= 1_000) return `$${(cap / 1_000).toFixed(2)}K`;
  return `$${cap.toFixed(2)}`;
}

/**
 * Formats a number with commas as thousand separators
 * @param {number} number - The number to format
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} - The formatted number
 */
export function formatNumber(number, decimals = 2) {
  return number.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
} 