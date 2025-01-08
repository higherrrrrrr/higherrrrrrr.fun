import { getApiUrl } from './getApiUrl';

// Helper to safely get auth token with Bearer
const getAuthHeader = () => {
  if (typeof window === 'undefined') return '';
  const token = localStorage.getItem('auth_token');
  return token ? `Bearer ${token}` : '';
};

// Helper to get/set factory address cookie
const getFactoryAddressCookie = () => {
  if (typeof window === 'undefined') return null;
  const cookies = document.cookie.split(';');
  const factoryAddressCookie = cookies.find(c => c.trim().startsWith('factory_address='));
  return factoryAddressCookie ? factoryAddressCookie.split('=')[1] : null;
};

const setFactoryAddressCookie = (address) => {
  if (typeof window === 'undefined') return;
  document.cookie = `factory_address=${address};max-age=604800;path=/`;
};

export async function getContractAddress() {
  // Check cookie first
  const cachedAddress = getFactoryAddressCookie();
  if (cachedAddress) {
    return { factory_address: cachedAddress };
  }

  // If no cookie, fetch from API
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

  // Cache the result if valid
  if (data.factory_address) {
    setFactoryAddressCookie(data.factory_address);
  }

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