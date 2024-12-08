import { getApiUrl } from './getApiUrl';

/**
 * Get token details
 * @param {string} address Token address
 * @returns {Promise<Object>} Token details
 */
export async function getToken(address) {
  try {
    const response = await fetch(`${getApiUrl()}/token/${address}`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch token:', error);
    throw error;
  }
}

/**
 * Get token creator
 * @param {string} address Token address
 * @returns {Promise<Object>} Creator details with source
 */
export async function getTokenCreator(address) {
  try {
    const response = await fetch(`${getApiUrl()}/token/${address}/creator`);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch token creator:', error);
    throw error;
  }
}

/**
 * Create or update token details
 * @param {string} address Token address
 * @param {Object} data Token data (twitter_url, telegram_url, website)
 * @param {string} authHeader The signed authorization header
 * @returns {Promise<Object>} Updated token details
 */
export async function upsertToken(address, data, authHeader) {
  try {
    const response = await fetch(`${getApiUrl()}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify({
        address,
        ...data
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to update token:', error);
    throw error;
  }
}

/**
 * List tokens with pagination
 * @param {number} page Page number (default: 1)
 * @param {number} perPage Items per page (default: 10)
 * @returns {Promise<Object>} Paginated token list
 */
export async function listTokens(page = 1, perPage = 10) {
  try {
    const response = await fetch(
      `${getApiUrl()}/tokens?page=${page}&per_page=${perPage}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to list tokens:', error);
    throw error;
  }
}