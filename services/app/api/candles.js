import { getApiUrl } from './getApiUrl';

export async function getCandles(address) {
  const response = await fetch(
    `${getApiUrl()}/candles/${address}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
} 