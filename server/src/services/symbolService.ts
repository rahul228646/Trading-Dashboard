import { Symbol } from "../types/trading";
import { FileService } from "./fileService";
import { Logger } from "../utils/logger";
import { AppError } from "../middleware/errorHandler";

export class SymbolService {
  private fileService: FileService;
  private symbolsCache: Map<string, Symbol> = new Map();
  private allSymbols: Symbol[] = [];

  constructor(fileService: FileService) {
    this.fileService = fileService;
  }

  async loadSymbols(): Promise<void> {
    try {
      const symbolsData = await this.fileService.readSymbolsFile();
      this.allSymbols = symbolsData;

      // Build cache for quick lookups
      this.symbolsCache.clear();
      symbolsData.forEach((symbol: Symbol) => {
        this.symbolsCache.set(symbol.symbol, symbol);
      });

      Logger.info(`Loaded ${symbolsData.length} symbols`);
    } catch (error) {
      Logger.error("Failed to load symbols:", error);
      throw error;
    }
  }

  getAllSymbols(): Symbol[] {
    return this.allSymbols;
  }

  getSymbol(symbol: string): Symbol | undefined {
    return this.symbolsCache.get(symbol.toUpperCase());
  }

  validateSymbolExists(symbol: string): boolean {
    return this.symbolsCache.has(symbol.toUpperCase());
  }

  getClosePrice(symbol: string): number {
    const symbolData = this.getSymbol(symbol);
    if (!symbolData) {
      throw new AppError(400, `Symbol ${symbol} not found`);
    }
    return symbolData.closePrice;
  }

  getPriceRange(
    symbol: string,
    variancePercent: number
  ): { min: number; max: number } {
    const closePrice = this.getClosePrice(symbol);
    const min = closePrice * (1 - variancePercent);
    const max = closePrice * (1 + variancePercent);

    return { min, max };
  }
}
