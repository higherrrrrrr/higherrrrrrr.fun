import { getApiUrl } from './getApiUrl';

export async function getTokenPrice(address) {
  const response = await fetch(
    `${getApiUrl()}/price/${address}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
}

export async function getEthPrice() {
  const response = await fetch(
    `${getApiUrl()}/eth/price`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
} 