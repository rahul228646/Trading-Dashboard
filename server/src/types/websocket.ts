// WebSocket message types
export interface WebSocketMessage {
  action: string;
  symbol?: string;
  data?: any;
}

export interface SubscribeMessage extends WebSocketMessage {
  action: "subscribe";
  symbol: string;
}

export interface UnsubscribeMessage extends WebSocketMessage {
  action: "unsubscribe";
  symbol: string;
}

export interface TickMessage {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface ErrorMessage {
  error: string;
  message?: string;
}

export interface ClientConnection {
  id: string;
  ws: any; // WebSocket type
  subscriptions: Set<string>;
}
