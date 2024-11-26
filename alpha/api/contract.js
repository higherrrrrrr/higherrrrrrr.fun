import { getApiUrl } from './getApiUrl';

// Helper to safely get auth token with Bearer
const getAuthHeader = () => {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('auth_token');
  return token ? `Bearer ${token}` : '';
};

export async function getContractAddress() {
  const response = await fetch(
    `${getApiUrl()}/contract-address`,
    {
      headers: {
        'Authorization': getAuthHeader()
      }
    }
  );

  const data = await response.json();
  console.log('Factory address:', data);
  return data;
}

export async function getLatestTokens(limit = 10) {
  console.log('Fetching latest tokens...');
  const response = await fetch(
    `${getApiUrl()}/tokens/latest?limit=${limit}`,
    {
      headers: {
        'Authorization': getAuthHeader()
      }
    }
  );
  const data = await response.json();
  console.log('API response for latest tokens:', data);
  return data;
} 