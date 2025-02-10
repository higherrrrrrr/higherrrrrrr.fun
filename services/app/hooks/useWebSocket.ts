import { useEffect, useCallback, useRef } from 'react';
import { env } from '@/lib/env';
import { toast } from 'react-hot-toast';

interface WebSocketOptions {
  tokens?: any[];
  onPriceUpdate?: (data: any) => void;
  onHolderUpdate?: (data: any) => void;
}

export function useWebSocket({ tokens, onPriceUpdate, onHolderUpdate }: WebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    try {
      // Don't try to connect if we don't have tokens
      if (!tokens?.length) {
        return;
      }

      // Don't reconnect if we've hit the limit
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.warn('Max WebSocket reconnection attempts reached');
        return;
      }

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.close();
      }

      const wsUrl = env.NEXT_PUBLIC_WS_URL;
      if (!wsUrl) {
        console.warn('WebSocket URL not configured');
        return;
      }

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttempts.current = 0;

        // Subscribe to token updates
        const tokenAddresses = tokens.map(t => t.address).filter(Boolean);
        if (tokenAddresses.length) {
          ws.send(JSON.stringify({
            type: 'subscribe',
            tokens: tokenAddresses
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          switch (data.type) {
            case 'price':
              onPriceUpdate?.(data);
              break;
            case 'holders':
              onHolderUpdate?.(data);
              break;
            default:
              console.warn('Unknown WebSocket message type:', data.type);
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('WebSocket connection error');
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        wsRef.current = null;

        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        }
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('Failed to establish WebSocket connection:', error);
      toast.error('Failed to connect to WebSocket');
    }
  }, [tokens, onPriceUpdate, onHolderUpdate]);

  // Connect when component mounts or tokens change
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

  // Resubscribe when tokens change
  useEffect(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN && tokens?.length) {
      const tokenAddresses = tokens.map(t => t.address).filter(Boolean);
      if (tokenAddresses.length) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          tokens: tokenAddresses
        }));
      }
    }
  }, [tokens]);
} 