import express from "express";
import { createServer } from "http";
import WebSocket from "ws";
import { corsMiddleware } from "./middleware/cors";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { createSymbolsRouter } from "./routes/symbols";
import { createOrdersRouter } from "./routes/orders";
import { createHealthRouter } from "./routes/health";
import { createTicksRouter } from "./routes/ticks";
import { FileService } from "./services/fileService";
import { SymbolService } from "./services/symbolService";
import { OrderService } from "./services/orderService";
import { TickService } from "./services/tickService";
import { SymbolsController } from "./controllers/symbolsController";
import { OrdersController } from "./controllers/ordersController";
import { TicksController } from "./controllers/ticksController";
import { ConnectionManager } from "./websocket/connectionManager";
import { Logger } from "./utils/logger";

export class App {
  public express: express.Application;
  public server: any;
  public wss: WebSocket.Server | null = null;

  // Services
  private fileService!: FileService;
  private symbolService!: SymbolService;
  private orderService!: OrderService;
  private tickService!: TickService;
  private connectionManager!: ConnectionManager;

  // Controllers
  private symbolsController!: SymbolsController;
  private ordersController!: OrdersController;
  private ticksController!: TicksController;

  constructor() {
    this.express = express();
    this.server = createServer(this.express);

    // Initialize services
    this.initializeServices();

    // Initialize controllers
    this.initializeControllers();

    // Setup middleware and routes
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeServices(): void {
    this.fileService = new FileService();
    this.symbolService = new SymbolService(this.fileService);
    this.orderService = new OrderService(this.fileService, this.symbolService);
    this.tickService = new TickService(this.symbolService);
    this.connectionManager = new ConnectionManager(this.tickService);
  }

  private initializeControllers(): void {
    this.symbolsController = new SymbolsController(this.symbolService);
    this.ordersController = new OrdersController(this.orderService);
    this.ticksController = new TicksController(this.tickService);
  }

  private initializeMiddleware(): void {
    // CORS
    this.express.use(corsMiddleware);

    // Body parsing
    this.express.use(express.json({ limit: "10mb" }));
    this.express.use(express.urlencoded({ extended: true }));

    // Request logging
    this.express.use((req, res, next) => {
      Logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });
      next();
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.express.use(
      "/api/symbols",
      createSymbolsRouter(this.symbolsController)
    );
    this.express.use("/api/orders", createOrdersRouter(this.ordersController));
    this.express.use("/api/ticks", createTicksRouter(this.ticksController));
    this.express.use("/api/health", createHealthRouter());

    // Root endpoint
    this.express.get("/", (req, res) => {
      res.json({
        name: "Trading Dashboard API",
        version: "1.0.0",
        status: "running",
        endpoints: {
          symbols: "/api/symbols",
          orders: "/api/orders",
          health: "/api/health",
          websocket: "/ws/ticks",
        },
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.express.use(notFoundHandler);

    // Global error handler
    this.express.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    try {
      // Ensure data directories exist
      await this.fileService.ensureDirectoriesExist();

      // Load symbols data
      await this.symbolService.loadSymbols();

      Logger.info("Application initialized successfully");
    } catch (error) {
      Logger.error("Failed to initialize application:", error);
      throw error;
    }
  }

  public initializeWebSocket(): void {
    this.wss = new WebSocket.Server({
      server: this.server,
      path: "/ws/ticks",
    });

    this.wss.on("connection", (ws: WebSocket) => {
      const clientId = this.connectionManager.addClient(ws);
      Logger.info(`WebSocket connection established: ${clientId}`);
    });

    this.wss.on("error", (error: Error) => {
      Logger.error("WebSocket server error:", error);
    });

    Logger.info("WebSocket server initialized on /ws/ticks");
  }

  public async cleanup(): Promise<void> {
    Logger.info("Starting graceful shutdown...");

    // Cleanup services
    this.tickService.cleanup();
    this.connectionManager.cleanup();

    // Close WebSocket server
    if (this.wss) {
      this.wss.close((error) => {
        if (error) {
          Logger.error("Error closing WebSocket server:", error);
        } else {
          Logger.info("WebSocket server closed");
        }
      });
    }

    // Close HTTP server
    if (this.server) {
      this.server.close((error: Error) => {
        if (error) {
          Logger.error("Error closing HTTP server:", error);
        } else {
          Logger.info("HTTP server closed");
        }
      });
    }

    Logger.info("Graceful shutdown completed");
  }
}
