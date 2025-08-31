import { Router } from "express";
import { TicksController } from "../controllers/ticksController";

export function createTicksRouter(ticksController: TicksController): Router {
  const router = Router();

  // GET /api/ticks/:symbol/latest - Get latest tick for a symbol
  router.get("/:symbol/latest", async (req, res) => {
    await ticksController.getLatestTick(req, res);
  });

  // GET /api/ticks/:symbol/history - Get tick history for a symbol
  router.get("/:symbol/history", async (req, res) => {
    await ticksController.getTickHistory(req, res);
  });

  return router;
}
