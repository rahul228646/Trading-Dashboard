import { Router } from "express";
import { SymbolsController } from "../controllers/symbolsController";
import { asyncHandler } from "../middleware/errorHandler";

export function createSymbolsRouter(
  symbolsController: SymbolsController
): Router {
  const router = Router();

  // GET /api/symbols - Get all tradeable symbols
  router.get(
    "/",
    asyncHandler(async (req: any, res: any) => {
      await symbolsController.getSymbols(req, res);
    })
  );

  return router;
}
