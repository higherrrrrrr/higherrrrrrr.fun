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
  return response.json();
} 