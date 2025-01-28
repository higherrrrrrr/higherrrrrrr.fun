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

// Development mock data
const MOCK_CONTRACT = {
  factory_address: "0x1234567890123456789012345678901234567890" // Replace with your test address
};

export async function getContractAddress() {
  // For development, return mock data
  if (process.env.NODE_ENV === 'development') {
    return MOCK_CONTRACT;
  }

  // Production code remains the same
  try {
    const response = await fetch('/api/contract-address', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching contract address:', error);
    throw error;
  }
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