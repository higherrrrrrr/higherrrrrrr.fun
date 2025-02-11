import { Connection, PublicKey } from '@solana/web3.js';
import { Helius } from 'helius-sdk';
import { env } from './env';

// Parse RPC URL correctly for both HTTP and WebSocket
const parseRpcUrl = (url: string) => {
  const isHelius = url.includes('helius');
  
  if (isHelius) {
    // Extract API key from URL
    const apiKey = url.split('api-key=')[1];
    return {
      http: `https://rpc.helius.xyz/?api-key=${apiKey}`,
      ws: `wss://rpc.helius.xyz/?api-key=${apiKey}`
    };
  }
  
  // Fallback for non-Helius URLs
  const baseUrl = url.split('?')[0];
  return {
    http: baseUrl,
    ws: baseUrl.replace('https://', 'wss://')
  };
};

const rpcUrls = parseRpcUrl(env.NEXT_PUBLIC_HELIUS_RPC_URL);

// Debug log the URLs (with masked API key)
console.log('RPC URLs:', {
  http: rpcUrls.http.replace(/api-key=[\w-]+/, 'api-key=****'),
  ws: rpcUrls.ws.replace(/api-key=[\w-]+/, 'api-key=****'),
});

// Create Solana connection
export const connection = new Connection(rpcUrls.http, {
  commitment: 'confirmed'
});

// Create Helius client
export const helius = new Helius(env.HELIUS_API_KEY);

// Export WebSocket URL for direct usage
export const wsUrl = rpcUrls.ws;

console.log('Connections initialized');

// That's it - no more code after this line