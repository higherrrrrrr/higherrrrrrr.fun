const isProduction = process.env.NODE_ENV === 'production';

export function getApiUrl(): string {
  if (isProduction) {
    return 'https://api.higherrrrrrr.fun';
  }
  return 'http://localhost:5000';
}

export function getFrontendUrl(): string {
  if (isProduction) {
    return 'https://alpha.higherrrrrrr.fun';
  }
  return 'http://localhost:3000';
}

export function getRpcUrl(): string {
  if (isProduction) {
    return 'https://base-mainnet.g.alchemy.com/v2/l0XzuD715Z-zd21ie5dbpLKrptTuq07a';
  }
  return 'http://localhost:8545'; // Standard anvil RPC endpoint
}

// Helper to check if we're in a browser environment
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

// Helper to get full API URL with endpoint
export function getApiEndpoint(endpoint: string): string {
  const baseUrl = getApiUrl();
  return `${baseUrl}/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
}

// Helper to get websocket RPC URL if needed
export function getWsRpcUrl(): string {
  if (isProduction) {
    return 'wss://base-mainnet.g.alchemy.com/v2/l0XzuD715Z-zd21ie5dbpLKrptTuq07a';
  }
  return 'ws://localhost:8545';
} 