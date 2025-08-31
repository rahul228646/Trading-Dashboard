import { App } from "./app";
import { CONFIG } from "./config/constants";
import { Logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  try {
    // Create and initialize the application
    const app = new App();
    await app.initialize();

    // Initialize WebSocket server
    app.initializeWebSocket();

    // Start the HTTP server
    app.server.listen(CONFIG.PORT, () => {
      Logger.info(`🚀 Server running on port ${CONFIG.PORT}`);
      Logger.info(`📊 Trading Dashboard API ready`);
      Logger.info(
        `🔌 WebSocket endpoint: ws://localhost:${CONFIG.PORT}/ws/ticks`
      );
      Logger.info(`🌐 API endpoints: http://localhost:${CONFIG.PORT}/api`);
      Logger.info(
        `🏥 Health check: http://localhost:${CONFIG.PORT}/api/health`
      );
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string) => {
      Logger.info(`Received ${signal}, starting graceful shutdown...`);

      try {
        await app.cleanup();
        process.exit(0);
      } catch (error) {
        Logger.error("Error during shutdown:", error);
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // Handle uncaught exceptions
    process.on("uncaughtException", (error: Error) => {
      Logger.error("Uncaught Exception:", error);
      gracefulShutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason: any) => {
      Logger.error("Unhandled Rejection:", reason);
      gracefulShutdown("unhandledRejection");
    });
  } catch (error) {
    Logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  bootstrap();
}
