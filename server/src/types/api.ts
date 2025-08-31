// API request/response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface GetSymbolsResponse {
  symbol: string;
  name: string;
  market: string;
  closePrice: number;
}

export interface CreateOrderResponse {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  timestamp: number;
}

export interface GetOrdersQuery {
  symbol: string;
}

export interface ErrorResponse {
  error: string;
}
