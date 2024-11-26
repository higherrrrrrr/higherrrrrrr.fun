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