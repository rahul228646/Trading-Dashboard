import path from "path";

export const CONFIG = {
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || "development",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:3000",
  DATA_DIR: process.env.DATA_DIR || "./data",

  // Tick generation settings
  TICK_INTERVAL_MIN: parseInt(process.env.TICK_INTERVAL_MIN || "1000"),
  TICK_INTERVAL_MAX: parseInt(process.env.TICK_INTERVAL_MAX || "2000"),

  // Rate limiting
  ORDER_RATE_LIMIT: parseInt(process.env.ORDER_RATE_LIMIT || "10"),

  // Price validation
  PRICE_VARIANCE_PERCENT: 0.2, // ±20%
  TICK_VARIANCE_PERCENT: 0.05, // ±5%

  // File paths
  SYMBOLS_FILE: path.join(process.env.DATA_DIR || "./data", "symbols.json"),
  ORDERS_DIR: path.join(process.env.DATA_DIR || "./data", "orders"),
};

export const ERRORS = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  PRICE_OUT_OF_RANGE: "PRICE_OUT_OF_RANGE",
  WEBSOCKET_ERROR: "WEBSOCKET_ERROR",
  SYMBOL_NOT_FOUND: "SYMBOL_NOT_FOUND",
  INVALID_REQUEST: "INVALID_REQUEST",
} as const;
