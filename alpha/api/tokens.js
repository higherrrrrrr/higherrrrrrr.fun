import { getApiUrl } from './getApiUrl';

export async function getTokens(page = 1, limit = 10) {
  const response = await fetch(
    `${getApiUrl()}/tokens?page=${page}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
}

export async function getToken(address) {
  const response = await fetch(
    `${getApiUrl()}/tokens/${address}`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
}

export async function getHighlightedToken() {
  const response = await fetch(
    `${getApiUrl()}/highlighted-token`,
    {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
    }
  );
  return response.json();
} 