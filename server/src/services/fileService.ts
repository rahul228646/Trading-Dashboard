import fs from "fs/promises";
import path from "path";
import { Order } from "../types/trading";
import { CONFIG } from "../config/constants";
import { Logger } from "../utils/logger";
import { AppError } from "../middleware/errorHandler";

export class FileService {
  private ordersPath: string;

  constructor() {
    this.ordersPath = CONFIG.ORDERS_DIR;
  }

  async ensureDirectoriesExist(): Promise<void> {
    try {
      await fs.access(CONFIG.DATA_DIR);
    } catch {
      await fs.mkdir(CONFIG.DATA_DIR, { recursive: true });
      Logger.info("Created data directory:", CONFIG.DATA_DIR);
    }

    try {
      await fs.access(this.ordersPath);
    } catch {
      await fs.mkdir(this.ordersPath, { recursive: true });
      Logger.info("Created orders directory:", this.ordersPath);
    }
  }

  async readOrdersFile(symbol: string): Promise<Order[]> {
    const filePath = path.join(
      this.ordersPath,
      `${this.sanitizeSymbol(symbol)}.json`
    );

    try {
      const data = await fs.readFile(filePath, "utf-8");
      const orders = JSON.parse(data);

      // Validate orders structure
      if (!Array.isArray(orders)) {
        Logger.warn(
          `Invalid orders file format for ${symbol}, returning empty array`
        );
        return [];
      }

      return orders;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        // File doesn't exist, return empty array
        return [];
      }

      Logger.error(`Error reading orders file for ${symbol}:`, error);
      throw new AppError(500, `Failed to read orders for ${symbol}`);
    }
  }

  async writeOrdersFile(symbol: string, orders: Order[]): Promise<void> {
    const fileName = `${this.sanitizeSymbol(symbol)}.json`;
    const filePath = path.join(this.ordersPath, fileName);
    const tempPath = `${filePath}.tmp`;

    try {
      // Write to temporary file first (atomic operation)
      await fs.writeFile(tempPath, JSON.stringify(orders, null, 2), "utf-8");

      // Rename to final file (atomic operation on most filesystems)
      await fs.rename(tempPath, filePath);

      Logger.debug(`Successfully wrote ${orders.length} orders to ${fileName}`);
    } catch (error) {
      // Clean up temp file if it exists
      try {
        await fs.unlink(tempPath);
      } catch {
        // Ignore cleanup errors
      }

      Logger.error(`Error writing orders file for ${symbol}:`, error);
      throw new AppError(500, `Failed to save orders for ${symbol}`);
    }
  }

  async appendOrder(symbol: string, order: Order): Promise<void> {
    const existingOrders = await this.readOrdersFile(symbol);
    existingOrders.push(order);
    await this.writeOrdersFile(symbol, existingOrders);
  }

  async readSymbolsFile(): Promise<any[]> {
    try {
      const data = await fs.readFile(CONFIG.SYMBOLS_FILE, "utf-8");
      const symbols = JSON.parse(data);

      if (!Array.isArray(symbols)) {
        throw new AppError(500, "Invalid symbols file format");
      }

      return symbols;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw new AppError(500, "Symbols file not found");
      }

      Logger.error("Error reading symbols file:", error);
      throw new AppError(500, "Failed to read symbols data");
    }
  }

  private sanitizeSymbol(symbol: string): string {
    // Remove any path traversal attempts and invalid characters
    return symbol.replace(/[^A-Z0-9-]/g, "").toUpperCase();
  }

  async validateSymbolFile(symbol: string): Promise<boolean> {
    const safePath = path.join(
      this.ordersPath,
      `${this.sanitizeSymbol(symbol)}.json`
    );
    const resolvedOrdersPath = path.resolve(this.ordersPath);
    const resolvedFilePath = path.resolve(safePath);

    return resolvedFilePath.startsWith(resolvedOrdersPath);
  }
}
