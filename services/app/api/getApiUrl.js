export function getApiUrl() {
  const isDevelopment = 
    typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  return isDevelopment 
    ? 'http://localhost:5000/api'
    : 'https://api.higherrrrrrr.fun/api';
} 