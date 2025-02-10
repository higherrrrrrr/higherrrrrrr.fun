import WebSocket from 'ws';
import { createServer } from 'http';
import { helius } from '../lib/helius';
import { connection } from '../lib/solana';
import { PublicKey } from '@solana/web3.js';

const port = process.env.WS_PORT || 8080;
const wss = new WebSocket.Server({ port: Number(port) });

console.log(`WebSocket server starting on port ${port}`);

// Add reconnection logic for Helius WebSocket
function connectHeliusWebSocket() {
  const heliusWs = new WebSocket(`wss://ws.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`);

  heliusWs.on('open', () => {
    console.log('Connected to Helius WebSocket');
    heliusWs.send(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tokenAccountSubscribe',
      params: []
    }));
  });

  heliusWs.on('error', (error) => {
    console.error('Helius WebSocket error:', error);
    setTimeout(connectHeliusWebSocket, 5000);
  });

  heliusWs.on('close', () => {
    console.log('Helius WebSocket closed, attempting to reconnect...');
    setTimeout(connectHeliusWebSocket, 5000);
  });

  return heliusWs;
}

const heliusWs = connectHeliusWebSocket();

// Forward Helius updates to our clients
heliusWs.on('message', (data) => {
  const update = JSON.parse(data.toString());
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(update));
    }
  });
});

// Create a map to store token subscriptions
const tokenSubscriptions = new Map();

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received:', data);
      
      // Handle subscriptions
      if (data.type === 'subscribe' && data.address) {
        // Subscribe to Solana account changes if not already subscribed
        if (!tokenSubscriptions.has(data.address)) {
          const subscription = connection.onAccountChange(
            new PublicKey(data.address),
            (accountInfo, context) => {
              wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                  client.send(JSON.stringify({
                    type: 'accountUpdate',
                    address: data.address,
                    data: accountInfo,
                    slot: context.slot
                  }));
                }
              });
            }
          );
          tokenSubscriptions.set(data.address, subscription);
        }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  });

  // Cleanup subscriptions on disconnect
  ws.on('close', () => {
    tokenSubscriptions.forEach((subscription, address) => {
      connection.removeAccountChangeListener(subscription);
    });
    tokenSubscriptions.clear();
  });
});

wss.on('error', (error) => {
  console.error('WebSocket server error:', error);
}); 