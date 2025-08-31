import { join } from "path";
import {
  readFileSync,
  writeFileSync,
  existsSync,
  unlinkSync,
  mkdirSync,
} from "fs";
/// <reference types="jest" />

// Mock CONFIG to use test directory (must be before service imports)
jest.mock("../config/constants", () => ({
  CONFIG: {
    DATA_DIR: join(__dirname, "..", "..", "test-data"),
    ORDERS_DIR: join(__dirname, "..", "..", "test-data", "orders"),
    SYMBOLS_FILE: join(__dirname, "..", "..", "test-data", "symbols.json"),
    PRICE_VARIANCE_PERCENT: 0.2, // ±20% as per assignment
  },
}));

import { OrderService } from "../services/orderService";
import { SymbolService } from "../services/symbolService";
import { FileService } from "../services/fileService";
import { CreateOrderRequest } from "../types/trading";

describe("OrderService - SDE1 Assignment Requirements", () => {
  let orderService: OrderService;
  let symbolService: SymbolService;
  let fileService: FileService;
  let testDataDir: string;

  beforeAll(async () => {
    testDataDir = join(__dirname, "..", "..", "test-data");

    // Create test data directory
    if (!existsSync(testDataDir)) {
      mkdirSync(testDataDir, { recursive: true });
    }
    const ordersDir = join(testDataDir, "orders");
    if (!existsSync(ordersDir)) {
      mkdirSync(ordersDir, { recursive: true });
    }

    // Create test symbols file as per assignment requirements
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
    writeFileSync(
      join(testDataDir, "symbols.json"),
      JSON.stringify(testSymbols)
    );

    // Initialize services
    fileService = new FileService();
    symbolService = new SymbolService(fileService);
    orderService = new OrderService(fileService, symbolService);

    // Load symbols into service
    await symbolService.loadSymbols();

    // Ensure directories exist
    await fileService.ensureDirectoriesExist();
  });

  beforeEach(() => {
    // Clean up order files before each test
    const ordersDir = join(testDataDir, "orders");
    if (existsSync(ordersDir)) {
      const files = require("fs").readdirSync(ordersDir);
      files.forEach((file: string) => {
        if (file.endsWith(".json")) {
          unlinkSync(join(ordersDir, file));
        }
      });
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
      } catch (err) {
        // Ignore cleanup errors
      }
    }
  });

  describe("Order Validation Rules (Assignment Requirement #4)", () => {
    describe("Price Validation - ±20% Rule", () => {
      it("should reject order with price above +20% of closePrice", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 220.0, // Above 216.14 (180.12 * 1.2)
        };

        await expect(orderService.createOrder(orderData)).rejects.toThrow(
          "Price must be within ±20% of AAPL closePrice"
        );
      });

      it("should reject order with price below -20% of closePrice", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 140.0, // Below 144.10 (180.12 * 0.8)
        };

        await expect(orderService.createOrder(orderData)).rejects.toThrow(
          "Price must be within ±20% of AAPL closePrice"
        );
      });

      it("should accept order with price exactly at +20% boundary", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 216.14, // Exactly 180.12 * 1.2
        };

        const order = await orderService.createOrder(orderData);
        expect(order).toBeDefined();
        expect(order.price).toBe(216.14);
      });

      it("should accept order with price exactly at -20% boundary", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 144.1, // Exactly 180.12 * 0.8
        };

        const order = await orderService.createOrder(orderData);
        expect(order).toBeDefined();
        expect(order.price).toBe(144.1);
      });

      it("should accept order with valid price within range", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 180.0, // Within valid range
        };

        const order = await orderService.createOrder(orderData);
        expect(order).toBeDefined();
        expect(order.symbol).toBe("AAPL");
        expect(order.price).toBe(180.0);
      });
    });

    describe("Quantity Validation", () => {
      it("should reject order with qty <= 0", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 0,
          price: 180.0,
        };

        await expect(orderService.createOrder(orderData)).rejects.toThrow();
      });

      it("should reject order with negative quantity", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: -5,
          price: 180.0,
        };

        await expect(orderService.createOrder(orderData)).rejects.toThrow();
      });

      it("should accept order with positive quantity", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 180.0,
        };

        const order = await orderService.createOrder(orderData);
        expect(order.qty).toBe(100);
      });
    });

    describe("Price Value Validation", () => {
      it("should reject order with price <= 0", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 0,
        };

        await expect(orderService.createOrder(orderData)).rejects.toThrow();
      });

      it("should reject order with negative price", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: -10.0,
        };

        await expect(orderService.createOrder(orderData)).rejects.toThrow();
      });
    });

    describe("Symbol Validation", () => {
      it("should reject order for invalid symbol", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "INVALID",
          side: "BUY",
          qty: 100,
          price: 180.0,
        };

        await expect(orderService.createOrder(orderData)).rejects.toThrow(
          "Symbol INVALID not found"
        );
      });

      it("should accept order for valid symbol", async () => {
        const orderData: CreateOrderRequest = {
          symbol: "AAPL",
          side: "BUY",
          qty: 100,
          price: 180.0,
        };

        const order = await orderService.createOrder(orderData);
        expect(order.symbol).toBe("AAPL");
      });
    });
  });

  describe("Order Creation (Assignment Requirement #3)", () => {
    it("should create order with correct structure", async () => {
      const orderData: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const order = await orderService.createOrder(orderData);

      // Verify order structure matches assignment requirements
      expect(order).toMatchObject({
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      });
      expect(order.id).toBeDefined();
      expect(order.timestamp).toBeDefined();
      expect(typeof order.timestamp).toBe("number");
    });

    it("should generate unique order IDs", async () => {
      const orderData: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const order1 = await orderService.createOrder(orderData);
      const order2 = await orderService.createOrder(orderData);

      expect(order1.id).not.toBe(order2.id);
    });

    it("should handle both BUY and SELL sides", async () => {
      const buyOrder: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const sellOrder: CreateOrderRequest = {
        symbol: "AAPL",
        side: "SELL",
        qty: 50,
        price: 185.0,
      };

      const buy = await orderService.createOrder(buyOrder);
      const sell = await orderService.createOrder(sellOrder);

      expect(buy.side).toBe("BUY");
      expect(sell.side).toBe("SELL");
    });
  });

  describe("File Writing (Assignment Requirement)", () => {
    it("should write order to correct symbol file", async () => {
      const orderData: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const order = await orderService.createOrder(orderData);

      // Verify file was created
      const orderFile = join(testDataDir, "orders", "AAPL.json");
      expect(existsSync(orderFile)).toBe(true);

      // Verify order was written correctly
      const fileContent = readFileSync(orderFile, "utf-8");
      const orders = JSON.parse(fileContent);
      expect(orders).toHaveLength(1);
      expect(orders[0]).toMatchObject({
        id: order.id,
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      });
    });

    it("should append multiple orders to same symbol file", async () => {
      const order1Data: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const order2Data: CreateOrderRequest = {
        symbol: "AAPL",
        side: "SELL",
        qty: 50,
        price: 185.0,
      };

      await orderService.createOrder(order1Data);
      await orderService.createOrder(order2Data);

      // Verify both orders are in the file
      const orderFile = join(testDataDir, "orders", "AAPL.json");
      const fileContent = readFileSync(orderFile, "utf-8");
      const orders = JSON.parse(fileContent);
      expect(orders).toHaveLength(2);
    });

    it("should create separate files for different symbols", async () => {
      const aaplOrder: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const msftOrder: CreateOrderRequest = {
        symbol: "MSFT",
        side: "BUY",
        qty: 50,
        price: 320.0,
      };

      await orderService.createOrder(aaplOrder);
      await orderService.createOrder(msftOrder);

      // Verify separate files exist
      const aaplFile = join(testDataDir, "orders", "AAPL.json");
      const msftFile = join(testDataDir, "orders", "MSFT.json");

      expect(existsSync(aaplFile)).toBe(true);
      expect(existsSync(msftFile)).toBe(true);

      // Verify correct content
      const aaplOrders = JSON.parse(readFileSync(aaplFile, "utf-8"));
      const msftOrders = JSON.parse(readFileSync(msftFile, "utf-8"));

      expect(aaplOrders[0].symbol).toBe("AAPL");
      expect(msftOrders[0].symbol).toBe("MSFT");
    });
  });

  describe("Order Retrieval (Assignment Requirement #5)", () => {
    it("should return empty array for symbol with no orders", async () => {
      const orders = await orderService.getOrdersBySymbol("MSFT");
      expect(orders).toEqual([]);
    });

    it("should retrieve orders for specific symbol", async () => {
      // Create orders for AAPL
      const order1: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const order2: CreateOrderRequest = {
        symbol: "AAPL",
        side: "SELL",
        qty: 50,
        price: 185.0,
      };

      const createdOrder1 = await orderService.createOrder(order1);
      const createdOrder2 = await orderService.createOrder(order2);

      // Retrieve orders
      const orders = await orderService.getOrdersBySymbol("AAPL");
      expect(orders).toHaveLength(2);
      expect(orders).toContainEqual(createdOrder1);
      expect(orders).toContainEqual(createdOrder2);
    });

    it("should only return orders for requested symbol", async () => {
      // Create orders for both symbols
      await orderService.createOrder({
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      });

      await orderService.createOrder({
        symbol: "MSFT",
        side: "BUY",
        qty: 50,
        price: 320.0,
      });

      // Verify AAPL orders only contain AAPL
      const aaplOrders = await orderService.getOrdersBySymbol("AAPL");
      const msftOrders = await orderService.getOrdersBySymbol("MSFT");

      expect(aaplOrders).toHaveLength(1);
      expect(msftOrders).toHaveLength(1);
      expect(aaplOrders[0].symbol).toBe("AAPL");
      expect(msftOrders[0].symbol).toBe("MSFT");
    });
  });

  describe("Error Handling", () => {
    it("should handle file system errors gracefully", async () => {
      // Mock file service to throw error
      const mockFileService = {
        ...fileService,
        appendOrder: jest
          .fn()
          .mockRejectedValue(new Error("File system error")),
      };

      const orderServiceWithMockFile = new OrderService(
        mockFileService as any,
        symbolService
      );

      const orderData: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      await expect(
        orderServiceWithMockFile.createOrder(orderData)
      ).rejects.toThrow("File system error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle decimal prices correctly", async () => {
      const orderData: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 100,
        price: 180.55,
      };

      const order = await orderService.createOrder(orderData);
      expect(order.price).toBe(180.55);
    });

    it("should handle large quantities", async () => {
      const orderData: CreateOrderRequest = {
        symbol: "AAPL",
        side: "BUY",
        qty: 1000000,
        price: 180.0,
      };

      const order = await orderService.createOrder(orderData);
      expect(order.qty).toBe(1000000);
    });

    it("should handle symbol case sensitivity", async () => {
      const orderData: CreateOrderRequest = {
        symbol: "aapl", // lowercase
        side: "BUY",
        qty: 100,
        price: 180.0,
      };

      const order = await orderService.createOrder(orderData);
      expect(order.symbol).toBe("AAPL"); // Should be normalized to uppercase
    });
  });
});
