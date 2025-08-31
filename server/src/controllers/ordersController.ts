import { Request, Response } from "express";
import { OrderService } from "../services/orderService";
import { CreateOrderRequest } from "../types/trading";
import { CreateOrderResponse, GetOrdersQuery } from "../types/api";
import { Logger } from "../utils/logger";

export class OrdersController {
  private orderService: OrderService;

  constructor(orderService: OrderService) {
    this.orderService = orderService;
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderData: CreateOrderRequest = req.body;
      const order = await this.orderService.createOrder(orderData);

      const response: CreateOrderResponse = {
        id: order.id,
        symbol: order.symbol,
        side: order.side,
        qty: order.qty,
        price: order.price,
        timestamp: order.timestamp,
      };

      Logger.info(`Order created successfully: ${order.id}`);
      res.status(201).json(response);
    } catch (error) {
      Logger.error("Error creating order:", error);

      // Error is already handled by AppError in the service layer
      throw error;
    }
  }

  async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.query;
      if (!symbol || typeof symbol !== "string") {
        throw new Error("Symbol parameter is required");
      }

      const orders = await this.orderService.getOrdersBySymbol(symbol);

      Logger.debug(`Returning ${orders.length} orders for ${symbol}`);
      res.json(orders);
    } catch (error) {
      Logger.error("Error getting orders:", error);

      // Error is already handled by AppError in the service layer
      throw error;
    }
  }
}
