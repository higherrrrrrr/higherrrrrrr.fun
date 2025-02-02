export function formatCountdown(msLeft) {
    if (msLeft <= 0) return 'Launched!';
  
    const days = Math.floor(msLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msLeft / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((msLeft / (1000 * 60)) % 60);
    const seconds = Math.floor((msLeft / 1000) % 60);
  
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  }

export function formatTokenAmount(amount, decimals = 18) {
  if (!amount) return '0';
  
  // Convert from wei to token units
  const divisor = BigInt(10) ** BigInt(decimals);
  const beforeDecimal = BigInt(amount) / divisor;
  const afterDecimal = BigInt(amount) % divisor;
  
  // Format the decimal portion
  let decimalStr = afterDecimal.toString().padStart(decimals, '0');
  // Remove trailing zeros
  decimalStr = decimalStr.replace(/0+$/, '');
  
  // Combine the parts
  return decimalStr ? `${beforeDecimal}.${decimalStr}` : beforeDecimal.toString();
}