import { Order, CreateOrderRequest, ValidationResult } from "../types/trading";
import { FileService } from "./fileService";
import { SymbolService } from "./symbolService";
import { IdGenerator } from "../utils/idGenerator";
import { Logger } from "../utils/logger";
import { AppError } from "../middleware/errorHandler";
import { CONFIG } from "../config/constants";

export class OrderService {
  private fileService: FileService;
  private symbolService: SymbolService;

  constructor(fileService: FileService, symbolService: SymbolService) {
    this.fileService = fileService;
    this.symbolService = symbolService;
  }

  async createOrder(orderData: CreateOrderRequest): Promise<Order> {
    // Validate the order
    const validationResult = this.validateOrder(orderData);
    if (!validationResult.valid) {
      throw new AppError(400, validationResult.errors.join(", "));
    }

    // Create the order with generated ID and timestamp
    const order: Order = {
      id: IdGenerator.generateOrderId(),
      symbol: orderData.symbol.toUpperCase(),
      side: orderData.side,
      qty: orderData.qty,
      price: orderData.price,
      timestamp: Math.floor(Date.now() / 1000), // Unix timestamp in seconds
    };

    try {
      // Save the order to file
      await this.fileService.appendOrder(order.symbol, order);

      Logger.info(
        `Created order: ${order.side} ${order.qty} ${order.symbol} @ ${order.price}`
      );
      return order;
    } catch (error) {
      Logger.error("Failed to create order:", error);
      throw error;
    }
  }

  async getOrdersBySymbol(symbol: string): Promise<Order[]> {
    // Validate symbol exists
    if (!this.symbolService.validateSymbolExists(symbol)) {
      throw new AppError(400, `Symbol ${symbol} not found`);
    }

    try {
      const orders = await this.fileService.readOrdersFile(symbol);
      Logger.debug(`Retrieved ${orders.length} orders for ${symbol}`);
      return orders;
    } catch (error) {
      Logger.error(`Failed to get orders for ${symbol}:`, error);
      throw error;
    }
  }

  validateOrder(orderData: CreateOrderRequest): ValidationResult {
    const errors: string[] = [];

    // Check if symbol exists
    if (!this.symbolService.validateSymbolExists(orderData.symbol)) {
      errors.push(`Symbol ${orderData.symbol} not found`);
      return { valid: false, errors };
    }

    // Validate quantity
    if (orderData.qty <= 0) {
      errors.push("Quantity must be greater than 0");
    }

    if (!Number.isInteger(orderData.qty)) {
      errors.push("Quantity must be an integer");
    }

    // Validate price
    if (orderData.price <= 0) {
      errors.push("Price must be greater than 0");
    }

    // Validate price range (±20% of closePrice)
    try {
      const priceRange = this.symbolService.getPriceRange(
        orderData.symbol,
        CONFIG.PRICE_VARIANCE_PERCENT
      );

      if (
        orderData.price < priceRange.min ||
        orderData.price > priceRange.max
      ) {
        errors.push(
          `Price must be within ±20% of ${
            orderData.symbol
          } closePrice (allowed: ${priceRange.min.toFixed(
            2
          )} to ${priceRange.max.toFixed(2)})`
        );
      }
    } catch (error) {
      errors.push(`Error validating price range: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
