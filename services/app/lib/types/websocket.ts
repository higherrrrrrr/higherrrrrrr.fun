export type WebSocketEventType = 'price' | 'volume' | 'holders' | 'status' | 'error';

export interface BaseWebSocketEvent {
  type: WebSocketEventType;
  timestamp: number;
}

export interface WebSocketPriceEvent extends BaseWebSocketEvent {
  type: 'price';
  address: string;
  price: number;
  priceChange24h: number;
}

export interface WebSocketVolumeEvent extends BaseWebSocketEvent {
  type: 'volume';
  address: string;
  volume24h: number;
}

export interface WebSocketHoldersEvent extends BaseWebSocketEvent {
  type: 'holders';
  address: string;
  holders: number;
  totalSupply: string;
}

export interface WebSocketStatusEvent {
  type: 'status';
  status: 'connected' | 'disconnected' | 'reconnecting' | 'error';
  timestamp: number;
}

export interface WebSocketErrorEvent extends BaseWebSocketEvent {
  type: 'error';
  error: string;
}

export type WebSocketEvent = 
  | WebSocketPriceEvent 
  | WebSocketVolumeEvent 
  | WebSocketHoldersEvent 
  | WebSocketStatusEvent 
  | WebSocketErrorEvent;

export interface HeliusWebSocketMessage {
  jsonrpc: '2.0';
  method: string;
  params: {
    result: {
      mint: string;
      amount: string;
      owner: string;
      price?: number;
      priceChange24h?: number;
    };
  };
}

export interface WebSocketMessage {
  type: 'accountUpdate' | 'price' | 'volume' | 'holders';
  address: string;
  data?: any;
  slot?: number;
  timestamp?: number;
} 