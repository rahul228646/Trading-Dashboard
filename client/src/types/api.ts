// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  error: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  symbol?: string;
  data?: any;
  error?: string;
}

export interface SubscribeMessage extends WebSocketMessage {
  type: "subscribe";
  symbol: string;
}

export interface UnsubscribeMessage extends WebSocketMessage {
  type: "unsubscribe";
  symbol: string;
}

export interface TickMessage extends WebSocketMessage {
  type: "tick";
  data: {
    symbol: string;
    price: number;
    volume: number;
    timestamp: number;
  };
}

export interface ErrorWebSocketMessage extends WebSocketMessage {
  type: "error";
  error: string;
}

export interface ErrorMessage {
  error: string;
  message?: string;
}
