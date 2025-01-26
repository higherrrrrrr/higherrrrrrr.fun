export { getApiUrl } from './getApiUrl';
export { getTokens, getToken, getHighlightedToken } from './tokens';
export { getTokenPrice, getEthPrice } from './price';
export { getCandles } from './candles';
export { getContractAddress } from './contract';

// Helper to get auth token
export function getAuthToken() {
  return typeof window !== 'undefined' 
    ? localStorage.getItem('auth_token')
    : null;
}

// Helper to check if we have auth
export function hasAuth() {
  return !!getAuthToken();
} 