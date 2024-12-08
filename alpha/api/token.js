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
export async function upsertToken(address, data, signature) {
  try {
    const response = await fetch(`${getApiUrl()}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${address}:${signature}`
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

/**
 * Update token details
 * @param {string} address Token address
 * @param {Object} data Token data (website, twitter, telegram, description, warpcast, systemPrompt, warpcastAppKey)
 * @returns {Promise<Object>} Updated token details
 */
export async function updateToken(address, data) {
  try {
    const response = await fetch(`${getApiUrl()}/token/${address}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        website: data.website,
        twitter: data.twitter,
        telegram: data.telegram,
        description: data.description,
        warpcast_url: data.warpcast,
        character_prompt: data.systemPrompt,
        warpcast_app_key: data.warpcastAppKey,
      }),
    });
    
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to update token:', error);
    throw error;
  }
}