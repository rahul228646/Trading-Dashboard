import { Request, Response } from "express";
import { SymbolService } from "../services/symbolService";
import { GetSymbolsResponse } from "../types/api";
import { Logger } from "../utils/logger";

export class SymbolsController {
  private symbolService: SymbolService;

  constructor(symbolService: SymbolService) {
    this.symbolService = symbolService;
  }

  async getSymbols(req: Request, res: Response): Promise<void> {
    try {
      const symbols = this.symbolService.getAllSymbols();

      const response: GetSymbolsResponse[] = symbols.map((symbol) => ({
        symbol: symbol.symbol,
        name: symbol.name,
        market: symbol.market,
        closePrice: symbol.closePrice,
      }));

      Logger.debug(`Returning ${symbols.length} symbols`);
      res.json(response);
    } catch (error) {
      Logger.error("Error getting symbols:", error);
      res.status(500).json({ error: "Failed to fetch symbols" });
    }
  }
}
