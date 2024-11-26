import { getApiEndpoint } from './config';

interface PaginationParams {
  page?: number;
  limit?: number;
}

interface TokenResponse {
  address: string;
  symbol: string;
  name: string;
  description: string;
  image_url: string;
  price_levels: {
    name: string;
    greater_than: string;
  }[];
  progress: number;
  price: number;
  volume_24h: number;
  market_cap: number;
  launch_date: string;
  ticker_data: number[];
}

interface NFTResponse {
  address: string;
  name: string;
  minted_at: string;
  image_url: string;
  url: string;
}

interface PriceResponse {
  token_address: string;
  price: number;
  timestamp: string;
}

interface EthPriceResponse {
  symbol: string;
  price_usd: number;
  timestamp: string;
}

interface CandleResponse {
  token_address: string;
  interval: string;
  candles: {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

// Helper to safely get auth token
function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token') || null;
  }
  return null;
}

// Helper to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export const api = {
  // Token endpoints
  async getTokens({ page = 1, limit = 10 }: PaginationParams = {}) {
    const response = await fetch(
      getApiEndpoint(`/tokens?page=${page}&limit=${limit}`),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  async getToken(address: string): Promise<TokenResponse> {
    const response = await fetch(
      getApiEndpoint(`/tokens/${address}`),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  async getHighlightedToken(): Promise<TokenResponse> {
    const response = await fetch(
      getApiEndpoint('/highlighted-token'),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  // NFT endpoints
  async getNFTs(address: string): Promise<NFTResponse[]> {
    const response = await fetch(
      getApiEndpoint(`/nfts/${address}`),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  // Price endpoints
  async getTokenPrice(address: string): Promise<PriceResponse> {
    const response = await fetch(
      getApiEndpoint(`/price/${address}`),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  async getEthPrice(): Promise<EthPriceResponse> {
    const response = await fetch(
      getApiEndpoint('/eth/price'),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  // Candle data
  async getCandles(address: string): Promise<CandleResponse> {
    const response = await fetch(
      getApiEndpoint(`/candles/${address}`),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  // Contract address
  async getContractAddress(): Promise<{ contract_address: string }> {
    const response = await fetch(
      getApiEndpoint('/contract-address'),
      {
        headers: getAuthHeaders()
      }
    );
    return response.json();
  },

  // File upload
  async uploadFile(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      getApiEndpoint('/upload'),
      {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData
      }
    );
    return response.json();
  }
}; 