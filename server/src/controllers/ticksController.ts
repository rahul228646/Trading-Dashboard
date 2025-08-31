import { Request, Response } from "express";
import { TickService } from "../services/tickService";

export class TicksController {
  constructor(private tickService: TickService) {}

  /**
   * Get the latest tick for a symbol
   * GET /api/ticks/:symbol/latest
   */
  async getLatestTick(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;

      if (!symbol) {
        res.status(400).json({
          error: "Symbol parameter is required",
          code: "MISSING_SYMBOL",
        });
        return;
      }

      const tick = this.tickService.getLatestTick(symbol.toUpperCase());

      // Return null for no data instead of 404 - this is a normal state
      res.json(tick);
    } catch (error) {
      console.error("Error getting latest tick:", error);
      res.status(500).json({
        error: "Internal server error while fetching tick data",
        code: "INTERNAL_ERROR",
      });
    }
  }

  /**
   * Get tick history for a symbol
   * GET /api/ticks/:symbol/history?limit=100
   */
  async getTickHistory(req: Request, res: Response): Promise<void> {
    try {
      const { symbol } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;

      if (!symbol) {
        res.status(400).json({
          error: "Symbol parameter is required",
          code: "MISSING_SYMBOL",
        });
        return;
      }

      if (limit <= 0 || limit > 1000) {
        res.status(400).json({
          error: "Limit must be between 1 and 1000",
          code: "INVALID_LIMIT",
        });
        return;
      }

      const ticks = this.tickService.getTickHistory(
        symbol.toUpperCase(),
        limit
      );

      res.json(ticks);
    } catch (error) {
      console.error("Error getting tick history:", error);
      res.status(500).json({
        error: "Internal server error while fetching tick history",
        code: "INTERNAL_ERROR",
      });
    }
  }
}
