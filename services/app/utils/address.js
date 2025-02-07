/**
 * Checks if the given address is a valid Solana address
 * @param {string} address - The address to check
 * @returns {boolean} - True if the address is a valid Solana address
 */
export function isValidSolanaAddress(address) {
  // Solana addresses are base58 encoded and 32-44 characters long
  const SOLANA_ADDRESS_REGEX = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
  
  try {
    // Basic format check
    if (!address || typeof address !== 'string') {
      return false;
    }

    // Check if matches Solana address pattern
    if (!SOLANA_ADDRESS_REGEX.test(address)) {
      return false;
    }

    // Additional checks could be added here
    // - Base58 validation
    // - Program derived address validation
    // - etc.

    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Checks if the given address is a valid EVM address
 * @param {string} address - The address to check
 * @returns {boolean} - True if the address is a valid EVM address
 */
export function isValidEvmAddress(address) {
  // EVM addresses are 42 characters long (including 0x prefix) and contain hex characters
  const EVM_ADDRESS_REGEX = /^0x[a-fA-F0-9]{40}$/;
  
  try {
    if (!address || typeof address !== 'string') {
      return false;
    }

    return EVM_ADDRESS_REGEX.test(address);
  } catch (error) {
    return false;
  }
}

/**
 * Formats an address for display by shortening it
 * @param {string} address - The address to format
 * @param {number} [startLength=6] - Number of characters to show at start
 * @param {number} [endLength=4] - Number of characters to show at end
 * @returns {string} - The formatted address
 */
export function formatAddress(address, startLength = 6, endLength = 4) {
  if (!address) return '';
  
  if (address.length <= startLength + endLength) {
    return address;
  }

  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
} 