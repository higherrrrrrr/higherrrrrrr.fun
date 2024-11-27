import { getApiUrl } from './getApiUrl';

// Helper to get auth token with Bearer
const getAuthHeader = () => {
  const token = localStorage.getItem('auth_token');
  return token ? `Bearer ${token}` : '';
};

export async function getHighlightedToken() {
  console.log('Fetching highlighted token...');
  try {
    const response = await fetch(
      `${getApiUrl()}/highlighted-token`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );
    
    // Log the raw response for debugging
    const text = await response.text();
    console.log('Raw API response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed highlighted token:', data);
      return data;
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      console.error('Raw response was:', text);
      throw parseError;
    }
  } catch (error) {
    console.error('Highlighted token fetch failed:', error);
    throw error;
  }
}

export async function getLatestTokens(limit = 10) {
  console.log('Fetching latest tokens...');
  try {
    const response = await fetch(
      `${getApiUrl()}/tokens/latest?limit=${limit}`,
      {
        headers: {
          'Authorization': getAuthHeader()
        }
      }
    );
    
    // Log the raw response for debugging
    const text = await response.text();
    console.log('Raw API response:', text);
    
    try {
      const data = JSON.parse(text);
      console.log('Parsed latest tokens:', data);
      
      if (!data.tokens) {
        throw new Error('No tokens array in response');
      }
      
      return data.tokens;
    } catch (parseError) {
      console.error('Failed to parse response:', parseError);
      console.error('Raw response was:', text);
      throw parseError;
    }
  } catch (error) {
    console.error('Latest tokens fetch failed:', error);
    throw error;
  }
} 