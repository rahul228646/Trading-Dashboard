// Core trading interfaces
export interface Symbol {
  symbol: string;
  name: string;
  market: string;
  closePrice: number;
}

export interface Tick {
  symbol: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface Order {
  id: number;
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
  timestamp: number;
}

export interface CreateOrderRequest {
  symbol: string;
  side: "BUY" | "SELL";
  qty: number;
  price: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface PriceRange {
  min: number;
  max: number;
}
