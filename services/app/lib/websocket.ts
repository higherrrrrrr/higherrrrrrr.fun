import { EventEmitter } from 'events';
import { toast } from 'react-hot-toast';
import type { 
  WebSocketEvent,
  WebSocketPriceEvent,
  WebSocketVolumeEvent,
  WebSocketHoldersEvent,
  WebSocketStatusEvent
} from './types/websocket';

type EventHandler = (data: WebSocketEvent) => void;

interface PriceUpdate {
  address: string;
  price: number;
  volume24h?: number;
  timestamp: number;
}

interface WebSocketError {
  code: string;
  message: string;
  timestamp: number;
}

interface HolderUpdate {
  address: string;
  holders: any[];
  totalSupply: string;
  timestamp: number;
}

interface WebSocketMessage {
  type: string;
  data: any;
}

type WebSocketStatus = 'connected' | 'disconnected' | 'reconnecting' | 'error';

class WSClient {
  private ws: WebSocket | null = null;
  private subscriptions = new Set<string>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout = 2000;
  private eventHandlers = new Map<string, Set<(data: WebSocketEvent) => void>>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isConnecting = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.connect();
      this.setupHeartbeat();
    }
  }

  private setupHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private cleanup() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
  }

  private validateMessage(data: any): data is WebSocketEvent {
    return (
      data &&
      typeof data.type === 'string' &&
      typeof data.address === 'string' &&
      typeof data.timestamp === 'number' &&
      (
        (data.type === 'price' && typeof data.price === 'number') ||
        (data.type === 'holders' && typeof data.holders === 'number')
      )
    );
  }

  private handleMessage(data: unknown) {
    try {
      if (!this.validateMessage(data)) {
        console.error('Invalid WebSocket message format:', data);
        return;
      }

      const handlers = this.eventHandlers.get(data.type);
      handlers?.forEach(handler => handler(data));
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  private async connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      this.isConnecting = true;
      
      if (!process.env.NEXT_PUBLIC_WS_URL) {
        console.warn('WebSocket URL not configured, running in offline mode');
        this.emitStatus('disconnected');
        return;
      }

      // Close existing connection if any
      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      console.log(`Attempting to connect to WebSocket at ${process.env.NEXT_PUBLIC_WS_URL}`);
      this.ws = new window.WebSocket(process.env.NEXT_PUBLIC_WS_URL);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.ws?.readyState !== WebSocket.OPEN) {
          console.warn('WebSocket connection timeout');
          this.ws?.close();
          this.handleReconnect();
        }
      }, 5000);

      this.ws.onopen = () => {
        clearTimeout(connectionTimeout);
        console.log('WebSocket connected successfully');
        this.reconnectAttempts = 0;
        this.resubscribe();
        this.emitStatus('connected');
      };

      this.ws.onclose = (event) => {
        console.log(`WebSocket closed with code ${event.code}${event.reason ? `: ${event.reason}` : ''}`);
        if (event.code !== 1000) { // 1000 is normal closure
          this.handleReconnect();
        }
        this.emitStatus('disconnected');
      };

      this.ws.onerror = () => {
        console.warn('WebSocket encountered an error');
        // Don't emit error here as onclose will be called next
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };
    } catch (error) {
      console.warn('WebSocket connection failed, running in offline mode:', error);
      this.emitStatus('disconnected');
    } finally {
      this.isConnecting = false;
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      toast.error('Unable to connect to WebSocket server');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff with 30s max
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    this.emitStatus('reconnecting');
    
    setTimeout(() => this.connect(), delay);
  }

  private resubscribe() {
    this.subscriptions.forEach(address => {
      this.ws?.send(JSON.stringify({ type: 'subscribe', address }));
    });
  }

  subscribe(address: string) {
    this.subscriptions.add(address);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'subscribe', address }));
    }
  }

  unsubscribe(address: string) {
    this.subscriptions.delete(address);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'unsubscribe', address }));
    }
  }

  on(event: string, handler: EventHandler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler) {
    this.eventHandlers.get(event)?.delete(handler);
  }

  private emitStatus(status: WebSocketStatus) {
    const statusEvent: WebSocketStatusEvent = {
      type: 'status',
      status,
      timestamp: Date.now()
    };
    const handlers = this.eventHandlers.get('status');
    handlers?.forEach(handler => handler(statusEvent));
  }
}

// Create a mock WebSocket client for development when no server is available
class MockWSClient {
  subscribe() { /* no-op */ }
  unsubscribe() { /* no-op */ }
  on() { /* no-op */ }
  off() { /* no-op */ }
}

// Export real or mock client based on environment
export const wsClient = typeof window !== 'undefined' 
  ? new WSClient() 
  : new MockWSClient(); 