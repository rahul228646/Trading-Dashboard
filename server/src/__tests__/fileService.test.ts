/// <reference types="jest" />

import { join } from "path";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  mkdirSync,
} from "fs";
import { FileService } from "../services/fileService";
import { Order } from "../types/trading";

// Mock CONFIG to use test directory
jest.mock("../config/constants", () => ({
  CONFIG: {
    DATA_DIR: join(__dirname, "..", "..", "test-data-file"),
    ORDERS_DIR: join(__dirname, "..", "..", "test-data-file", "orders"),
    SYMBOLS_FILE: join(__dirname, "..", "..", "test-data-file", "symbols.json"),
  },
}));

describe("FileService - SDE1 Assignment File Writing Requirements", () => {
  let fileService: FileService;
  let testDataDir: string;

  beforeAll(() => {
    testDataDir = join(__dirname, "..", "..", "test-data-file");
    fileService = new FileService();
  });

  beforeEach(() => {
    // Clean up before each test
    if (existsSync(testDataDir)) {
      const ordersDir = join(testDataDir, "orders");
      if (existsSync(ordersDir)) {
        const files = require("fs").readdirSync(ordersDir);
        files.forEach((file: string) => {
          unlinkSync(join(ordersDir, file));
        });
      }
      // Also clean up symbols file
      const symbolsFile = join(testDataDir, "symbols.json");
      if (existsSync(symbolsFile)) {
        unlinkSync(symbolsFile);
      }
    }
  });

  afterAll(() => {
    // Clean up test data
    if (existsSync(testDataDir)) {
      try {
        const ordersDir = join(testDataDir, "orders");
        if (existsSync(ordersDir)) {
          const files = require("fs").readdirSync(ordersDir);
          files.forEach((file: string) => {
            unlinkSync(join(ordersDir, file));
          });
          require("fs").rmdirSync(ordersDir);
        }
        if (existsSync(join(testDataDir, "symbols.json"))) {
          unlinkSync(join(testDataDir, "symbols.json"));
        }
        require("fs").rmdirSync(testDataDir);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  });

  describe("Directory Management", () => {
    it("should create directories if they do not exist", async () => {
      await fileService.ensureDirectoriesExist();

      expect(existsSync(testDataDir)).toBe(true);
      expect(existsSync(join(testDataDir, "orders"))).toBe(true);
    });
  });

  describe("Symbol File Operations", () => {
    it("should read symbols file when it exists", async () => {
      // Create test symbols file
      const testSymbols = [
        {
          symbol: "AAPL",
          name: "Apple Inc.",
          market: "NASDAQ",
          closePrice: 180.12,
        },
        {
          symbol: "MSFT",
          name: "Microsoft Corp.",
          market: "NASDAQ",
          closePrice: 323.45,
        },
      ];

      await fileService.ensureDirectoriesExist();
      writeFileSync(
        join(testDataDir, "symbols.json"),
        JSON.stringify(testSymbols)
      );

      const symbols = await fileService.readSymbolsFile();
      expect(symbols).toEqual(testSymbols);
      expect(symbols).toHaveLength(2);
      expect(symbols[0].symbol).toBe("AAPL");
    });

    it("should throw error when symbols file does not exist", async () => {
      await expect(fileService.readSymbolsFile()).rejects.toThrow(
        "Symbols file not found"
      );
    });
  });

  describe("Order File Operations - Assignment Requirement", () => {
    it("should write order to file", async () => {
      const order: Order = {
        id: 1,
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.12,
        timestamp: Date.now(),
      };

      await fileService.ensureDirectoriesExist();
      await fileService.appendOrder("AAPL", order);

      const orderFilePath = join(testDataDir, "orders", "AAPL.json");
      expect(existsSync(orderFilePath)).toBe(true);

      const fileContent = readFileSync(orderFilePath, "utf-8");
      const orders = JSON.parse(fileContent);
      expect(orders).toHaveLength(1);
      expect(orders[0]).toEqual(order);
    });

    it("should append multiple orders to same symbol file", async () => {
      const order1: Order = {
        id: 1,
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.12,
        timestamp: Date.now(),
      };

      const order2: Order = {
        id: 2,
        symbol: "AAPL",
        side: "SELL",
        qty: 50,
        price: 185.0,
        timestamp: Date.now(),
      };

      await fileService.ensureDirectoriesExist();
      await fileService.appendOrder("AAPL", order1);
      await fileService.appendOrder("AAPL", order2);

      const orderFilePath = join(testDataDir, "orders", "AAPL.json");
      const fileContent = readFileSync(orderFilePath, "utf-8");
      const orders = JSON.parse(fileContent);

      expect(orders).toHaveLength(2);
      expect(orders[0]).toEqual(order1);
      expect(orders[1]).toEqual(order2);
    });

    it("should read orders from file", async () => {
      const orders: Order[] = [
        {
          id: 1,
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 180.12,
          timestamp: Date.now(),
        },
      ];

      await fileService.ensureDirectoriesExist();
      const orderFilePath = join(testDataDir, "orders", "AAPL.json");
      writeFileSync(orderFilePath, JSON.stringify(orders));

      const readOrders = await fileService.readOrdersFile("AAPL");
      expect(readOrders).toEqual(orders);
    });

    it("should return empty array for non-existent order file", async () => {
      const orders = await fileService.readOrdersFile("NONEXISTENT");
      expect(orders).toEqual([]);
    });
  });

  describe("Error Handling", () => {
    it("should handle file system errors gracefully", async () => {
      // Mock fs.writeFile to throw an error (FileService uses fs/promises)
      const fs = require("fs/promises");
      const originalWriteFile = fs.writeFile;
      jest
        .spyOn(fs, "writeFile")
        .mockRejectedValue(new Error("File system error"));

      const order: Order = {
        id: 1,
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.12,
        timestamp: Date.now(),
      };

      await expect(fileService.appendOrder("AAPL", order)).rejects.toThrow();

      // Restore original implementation
      jest.spyOn(fs, "writeFile").mockImplementation(originalWriteFile);
    });
  });
});
