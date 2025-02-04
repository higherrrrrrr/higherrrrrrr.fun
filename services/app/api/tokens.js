import { getApiUrl } from './getApiUrl';

// Helper to get auth token with Bearer
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  return token ? `Bearer ${token}` : '';
};

export async function getHighlightedTokens() {
  console.log('Fetching highlighted tokens...');
  try {
    const response = await fetch(
      `${getApiUrl()}/highlighted-token`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );
    
    const data = await response.json();
    console.log('Highlighted tokens:', data);
    return data.tokens || [];
  } catch (error) {
    console.error('Highlighted tokens fetch failed:', error);
    return [];
  }
}

export async function getLatestTokens() {
  console.log('Fetching latest tokens...');
  try {
    const response = await fetch(
      `${getApiUrl()}/tokens/latest`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );
    
    const data = await response.json();
    console.log('Parsed latest tokens:', data);
    
    if (!data.tokens) {
      throw new Error('No tokens array in response');
    }
    
    return {
      tokens: data.tokens,
      updatedAt: data.updated_at
    };
  } catch (error) {
    console.error('Latest tokens fetch failed:', error);
    throw error;
  }
}

export async function getTopTradingTokens() {
  try {
    const response = await fetch(
      `${getApiUrl()}/tokens/top-trading`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );
    
    // Log the raw response for debugging
    const text = await response.text();

    try {
      const data = JSON.parse(text);
      console.log('Parsed top trading tokens:', data);
      
      if (!data.tokens) {
        throw new Error('No tokens array in response');
      }
      
      return {
        tokens: data.tokens,
        updatedAt: data.updated_at
      };
    } catch (parseError) {
      throw parseError;
    }
  } catch (error) {
    throw error;
  }
} 