/**
 * Gets the progress percentage to the next level
 * @param {Object} tokenState - The token state object
 * @returns {number} - Progress percentage (0-100)
 */
export function getProgressToNextLevel(tokenState) {
  if (!tokenState?.priceLevels || !tokenState?.currentPrice) {
    return 0;
  }

  const currentPriceEth = parseFloat(tokenState.currentPrice);
  const currentLevelIndex = getCurrentLevelIndex(tokenState);
  
  // If we're at the max level, return 100%
  if (currentLevelIndex === tokenState.priceLevels.length - 1) {
    return 100;
  }

  // If we haven't reached the first level yet
  if (currentLevelIndex === -1) {
    const firstLevelPrice = parseFloat(tokenState.priceLevels[0].price);
    return (currentPriceEth / firstLevelPrice) * 100;
  }

  const currentLevelPrice = parseFloat(tokenState.priceLevels[currentLevelIndex].price);
  const nextLevelPrice = parseFloat(tokenState.priceLevels[currentLevelIndex + 1].price);
  
  // Calculate progress between current level and next level
  const progress = ((currentPriceEth - currentLevelPrice) / (nextLevelPrice - currentLevelPrice)) * 100;
  
  return Math.min(Math.max(progress, 0), 100); // Clamp between 0 and 100
}

/**
 * Gets the current level index based on price
 * @param {Object} tokenState - The token state object
 * @returns {number} - Current level index (-1 if below first level)
 */
export function getCurrentLevelIndex(tokenState) {
  if (!tokenState?.priceLevels || !tokenState?.currentPrice) {
    return -1;
  }

  const currentPriceEth = parseFloat(tokenState.currentPrice);
  
  return tokenState.priceLevels.reduce((highestIndex, level, index) => {
    const levelPrice = parseFloat(level.price);
    return currentPriceEth >= levelPrice ? index : highestIndex;
  }, -1);
}

/**
 * Checks if a token is at its max level
 * @param {Object} tokenState - The token state object
 * @returns {boolean} - True if at max level
 */
export function isAtMaxLevel(tokenState) {
  const currentIndex = getCurrentLevelIndex(tokenState);
  return currentIndex === tokenState.priceLevels.length - 1;
}

/**
 * Gets the next level price
 * @param {Object} tokenState - The token state object
 * @returns {string|null} - Next level price or null if at max level
 */
export function getNextLevelPrice(tokenState) {
  const currentIndex = getCurrentLevelIndex(tokenState);
  if (currentIndex === -1) {
    return tokenState.priceLevels[0]?.price || null;
  }
  return tokenState.priceLevels[currentIndex + 1]?.price || null;
}

/**
 * Gets the current level name
 * @param {Object} tokenState - The token state object
 * @returns {string} - Current level name or empty string
 */
export function getCurrentLevelName(tokenState) {
  const currentIndex = getCurrentLevelIndex(tokenState);
  if (currentIndex === -1) {
    return '';
  }
  return tokenState.priceLevels[currentIndex]?.name || '';
} 