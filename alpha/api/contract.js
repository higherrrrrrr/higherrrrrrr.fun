import { getApiUrl } from './getApiUrl';

export async function getContractAddress() {
  const response = await fetch(
    `${getApiUrl()}/contract-address`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );

  const data = await response.json();
  console.log('Factory address:', data);
  return data;
}

export async function getLatestTokens(limit = 10) {
  const response = await fetch(
    `${getApiUrl()}/tokens/latest?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
} 