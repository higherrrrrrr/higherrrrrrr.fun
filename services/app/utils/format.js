/**
 * Formats a USD price with appropriate decimal places
 * @param {number} price - The price to format
 * @returns {string} - The formatted price
 */
export function formatUsdPrice(price) {
  // Convert to number and handle invalid inputs
  const num = Number(price);
  if (isNaN(num) || !isFinite(num)) return '0.00';
  
  if (num < 0.000001) return num.toExponential(2);
  if (num < 0.01) return num.toFixed(6);
  if (num < 1) return num.toFixed(4);
  return num.toFixed(2);
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