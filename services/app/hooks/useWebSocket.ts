import { useEffect, useCallback, useRef } from 'react';
import { clientEnv } from '@/lib/env.client';
import { toast } from 'react-hot-toast';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface WebSocketOptions {
  tokens?: any[];
  onPriceUpdate?: (data: any) => void;
  onHolderUpdate?: (data: any) => void;
  onWalletUpdate?: (data: any) => void;
}

export function useWebSocket({ tokens, onPriceUpdate, onHolderUpdate, onWalletUpdate }: WebSocketOptions) {
  const { primaryWallet } = useDynamicContext();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      const wsUrl = 'ws://localhost:8080';
      console.log('Creating new WebSocket connection to:', wsUrl);
      
      // Create WebSocket without protocol for testing
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      
      const connectionTimeout = setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          ws.close();
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            connect();
          }
        }
      }, 5000);

      ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
        reconnectAttempts.current = 0;

        // Send test message
        ws.send(JSON.stringify({ type: 'test', message: 'Hello server!' }));
      };

      ws.onerror = (event) => {
        const errorDetails = {
          url: wsUrl,
          readyState: ws.readyState,
          timestamp: new Date().toISOString(),
          error: event instanceof ErrorEvent ? event.message : 'Unknown error'
        };
        
        console.error('WebSocket connection error:', errorDetails);
        
        // Close the connection explicitly
        ws.close();
        
        if (reconnectAttempts.current < maxReconnectAttempts) {
          console.log(`Attempting reconnect ${reconnectAttempts.current + 1}/${maxReconnectAttempts}`);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, 3000 * (reconnectAttempts.current + 1));
        } else {
          console.error('Max reconnection attempts reached');
          toast.error('Failed to connect to WebSocket server');
        }
      };

      ws.onclose = (event) => {
        console.log('WebSocket connection closed:', {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean
        });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('Received WebSocket message:', data);
          
          switch (data.type) {
            case 'tokenUpdate':
              onPriceUpdate?.(data.data);
              break;
            case 'walletUpdate':
              onWalletUpdate?.(data);
              break;
            default:
              console.warn('Unknown WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
    }
  }, [tokens, onPriceUpdate, onWalletUpdate, maxReconnectAttempts]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);
} 