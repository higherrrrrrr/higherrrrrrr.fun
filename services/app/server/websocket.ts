import WebSocket from 'ws';
import { PublicKey } from '@solana/web3.js';
import { env } from './env';
import { wsUrl } from './connections';
import { getTokenBalance } from '@/lib/utils/solana';

const serverPort = 8080; // Use fixed port instead of parsing from URL
const heliusWsUrl = env.HELIUS_WS_URL;

console.log('Starting WebSocket server with config:', {
  serverPort,
  heliusWsUrl: heliusWsUrl?.replace(/api-key=[\w-]+/, 'api-key=****')
});

const wss = new WebSocket.Server({ 
  port: serverPort,
  perMessageDeflate: false,
  clientTracking: true,
  handleProtocols: (protocols) => {
    if (!protocols) return false;
    const protocolArray = Array.isArray(protocols) ? protocols : [protocols];
    return protocolArray.includes('ws') ? 'ws' : false;
  }
});

console.log(`Local WebSocket server starting on port ${serverPort}`);
console.log('Using Helius WebSocket URL:', wsUrl.replace(/api-key=[\w-]+/, 'api-key=****'));

const subscriptions = new Map<string, { type: string; address: string }>();
const TOKEN_PROGRAM_ID = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

function connectHeliusWebSocket() {
  console.log('Attempting to connect to Helius WebSocket...');
  
  const heliusWs = new WebSocket(wsUrl, {
    handshakeTimeout: 10000,
    maxPayload: 100 * 1024 * 1024
  });

  heliusWs.on('open', () => {
    console.log('Connected to Helius WebSocket');
  });

  heliusWs.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      // Handle subscription confirmations
      if (message.result !== undefined) {
        console.log('Subscription confirmed with ID:', message.result);
      }
      
      // Handle account updates
      if (message.params?.result) {
        const update = message.params.result;
        const subscriptionId = message.params.subscription;
        const subscription = subscriptions.get(subscriptionId);
        
        if (!subscription) return;

        // Different handling based on subscription type
        if (subscription.type === 'wallet') {
          // Get updated token balances for wallet
          const walletTokens = await getTokenBalance(subscription.address, update.accountId);
          
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'walletUpdate',
                address: subscription.address,
                tokens: walletTokens,
                timestamp: Date.now()
              }));
            }
          });
        } else {
          // Token updates (price, volume, holders)
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'tokenUpdate',
                address: subscription.address,
                data: {
                  price: update.price,
                  volume: update.volume,
                  holders: update.holders,
                  timestamp: Date.now()
                }
              }));
            }
          });
        }
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  heliusWs.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  heliusWs.on('close', (code, reason) => {
    console.log(`WebSocket connection closed (${code}): ${reason}`);
    console.log('Attempting to reconnect in 5 seconds...');
    setTimeout(connectHeliusWebSocket, 5000);
  });

  return heliusWs;
}

// Initialize WebSocket connection
const heliusWs = connectHeliusWebSocket();

// Handle client connections
wss.on('connection', (ws, req) => {
  console.log('Client connected:', {
    headers: req.headers,
    time: new Date().toISOString()
  });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Echo back for testing
      ws.send(JSON.stringify({ type: 'echo', data }));
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  heliusWs.close();
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

wss.on('listening', () => {
  console.log(`Local WebSocket server listening on port ${serverPort}`);
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
}); 