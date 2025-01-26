import { add } from 'date-fns';
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

/**
 * Get quote for buying tokens
 * @param {string} address Token address
 * @param {string} amount Amount of tokens to buy in wei
 * @param {string} poolAddress Uniswap V3 pool address
 * @returns {Promise<Object>} Quote details including price, fees, etc.
 */
export async function getBuyQuote(address, amount, poolAddress) {
  try {
    const response = await fetch(
      `${getApiUrl()}/token/${address}/quote/buy?amount=${amount}&pool=${poolAddress}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get buy quote:', error);
    throw error;
  }
}

/**
 * Get quote for selling tokens
 * @param {string} address Token address
 * @param {string} amount Amount of tokens to sell in wei
 * @param {string} poolAddress Uniswap V3 pool address
 * @returns {Promise<Object>} Quote details including price, fees, etc.
 */
export async function getSellQuote(address, amount, poolAddress) {
  try {
    const response = await fetch(
      `${getApiUrl()}/token/${address}/quote/sell?amount=${amount}&pool=${poolAddress}`
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get sell quote:', error);
    throw error;
  }
}

/**
 * Generate example tweet for a token
 * @param {string} aiCharacter AI character
 * @returns {Promise<string>} Generated tweet
 */
export async function generateExampleTweet(aiCharacter) {
  try {
    const response = await fetch(
      `${getApiUrl()}/generate-example-tweet`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ai_character: aiCharacter
        })
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate example tweet');
    }

    const data = await response.json();
    return data.tweet;
    
  } catch (error) {
    console.error('Error generating example tweet:', error);
    throw error;
  }
}

/**
 * Start Twitter connection flow for a token
 * @param {string} address Token address
 * @returns {Promise<string>} Twitter auth URL
 */
export async function connectTwitter(token_address, state) {
  const response = await fetch(`${getApiUrl()}/twitter/connect/${token_address}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ state })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start Twitter connection');
  }

  const data = await response.json();
  return data.auth_url;
}

/**
 * Disconnect Twitter from a token
 * @param {string} address Token address
 * @param {string} signature Auth signature
 */
export async function disconnectTwitter(address, signature) {
  try {
    const response = await fetch(
      `${getApiUrl()}/twitter/disconnect/${address}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${address}:${signature}`
        }
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to disconnect Twitter');
    }
  } catch (error) {
    console.error('Failed to disconnect Twitter:', error);
    throw error;
  }
}

/**
 * Complete Twitter connection flow
 * @param {string} token_address Token address
 * @param {string} verifier OAuth verifier
 * @param {string} oauth_token OAuth token
 * @param {string} signature Auth signature
 * @param {string} address User's wallet address
 * @returns {Promise<Object>} Response with username
 */
export async function completeTwitterConnect(token_address, verifier, oauth_token, address, signature) {
  const response = await fetch(`${getApiUrl()}/twitter/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${address}:${signature}`
    },
    body: JSON.stringify({
      verifier,
      token_address,
      oauth_token, 
      address: token_address,
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to complete Twitter connection');
  }

  return await response.json();
}