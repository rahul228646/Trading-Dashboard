import { Router } from "express";
import { OrdersController } from "../controllers/ordersController";
import {
  validateCreateOrder,
  validateGetOrders,
} from "../middleware/validation";
import { asyncHandler } from "../middleware/errorHandler";

export function createOrdersRouter(ordersController: OrdersController): Router {
  const router = Router();

  // POST /api/orders - Create a new order
  router.post(
    "/",
    validateCreateOrder,
    asyncHandler(async (req: any, res: any) => {
      await ordersController.createOrder(req, res);
    })
  );

  // GET /api/orders?symbol=AAPL - Get orders for a specific symbol
  router.get(
    "/",
    validateGetOrders,
    asyncHandler(async (req: any, res: any) => {
      await ordersController.getOrders(req, res);
    })
  );

  // GET /api/orders/:symbol - Alternative route for getting orders by symbol
  router.get(
    "/:symbol",
    asyncHandler(async (req: any, res: any) => {
      // Transform params to query for compatibility
      req.query.symbol = req.params.symbol;
      await ordersController.getOrders(req, res);
    })
  );

  return router;
}
