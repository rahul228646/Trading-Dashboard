import WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import {
  ClientConnection,
  TickMessage,
  SubscribeMessage,
  UnsubscribeMessage,
} from "../types/websocket";
import { TickService } from "../services/tickService";
import { Logger } from "../utils/logger";
import { SubscribeSchema, UnsubscribeSchema } from "../middleware/validation";

export class ConnectionManager {
  private clients: Map<string, ClientConnection> = new Map();
  private tickService: TickService;

  constructor(tickService: TickService) {
    this.tickService = tickService;

    // Set the broadcast callback for tick service
    this.tickService.setBroadcastCallback((symbol: string, tick: any) => {
      this.broadcastTick(symbol, tick);
    });
  }

  addClient(ws: WebSocket): string {
    const clientId = uuidv4();
    const connection: ClientConnection = {
      id: clientId,
      ws,
      subscriptions: new Set(),
    };

    this.clients.set(clientId, connection);
    Logger.info(`Client connected: ${clientId}`);

    // Setup WebSocket event handlers
    ws.on("message", (data: WebSocket.Data) => {
      this.handleMessage(clientId, data);
    });

    ws.on("close", () => {
      this.removeClient(clientId);
    });

    ws.on("error", (error: Error) => {
      Logger.error(`WebSocket error for client ${clientId}:`, error);
      this.removeClient(clientId);
    });

    return clientId;
  }

  removeClient(clientId: string): void {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    // Unsubscribe from all symbols
    for (const symbol of connection.subscriptions) {
      this.tickService.removeSubscriber(clientId, symbol);
    }

    this.clients.delete(clientId);
    Logger.info(`Client disconnected: ${clientId}`);
  }

  private handleMessage(clientId: string, data: WebSocket.Data): void {
    try {
      const message = JSON.parse(data.toString());

      switch (message.action) {
        case "subscribe":
          this.handleSubscribe(clientId, message as SubscribeMessage);
          break;
        case "unsubscribe":
          this.handleUnsubscribe(clientId, message as UnsubscribeMessage);
          break;
        default:
          this.sendError(
            clientId,
            "Invalid action. Supported actions: subscribe, unsubscribe"
          );
      }
    } catch (error) {
      Logger.error(`Error parsing message from client ${clientId}:`, error);
      this.sendError(clientId, "Invalid message format. Expected JSON.");
    }
  }

  private handleSubscribe(clientId: string, message: SubscribeMessage): void {
    try {
      // Validate message format
      const validatedMessage = SubscribeSchema.parse(message);
      const symbol = validatedMessage.symbol.toUpperCase();

      const connection = this.clients.get(clientId);
      if (!connection) {
        Logger.warn(
          `Received subscribe message from unknown client: ${clientId}`
        );
        return;
      }

      // Add to tick service
      this.tickService.addSubscriber(clientId, symbol);

      // Track subscription in connection
      connection.subscriptions.add(symbol);

      // Send confirmation
      this.sendMessage(clientId, {
        action: "subscribed",
        symbol,
        message: `Subscribed to ${symbol}`,
      });

      // Send current price if available
      const currentPrice = this.tickService.getCurrentPrice(symbol);
      if (currentPrice) {
        const tick: TickMessage = {
          symbol,
          price: currentPrice,
          volume: 0, // Volume will be updated with next real tick
          timestamp: Math.floor(Date.now() / 1000),
        };
        this.sendMessage(clientId, tick);
      }
    } catch (error) {
      Logger.error(`Error subscribing client ${clientId}:`, error);
      this.sendError(clientId, `Failed to subscribe: ${error}`);
    }
  }

  private handleUnsubscribe(
    clientId: string,
    message: UnsubscribeMessage
  ): void {
    try {
      // Validate message format
      const validatedMessage = UnsubscribeSchema.parse(message);
      const symbol = validatedMessage.symbol.toUpperCase();

      const connection = this.clients.get(clientId);
      if (!connection) {
        Logger.warn(
          `Received unsubscribe message from unknown client: ${clientId}`
        );
        return;
      }

      // Remove from tick service
      this.tickService.removeSubscriber(clientId, symbol);

      // Remove from connection tracking
      connection.subscriptions.delete(symbol);

      // Send confirmation
      this.sendMessage(clientId, {
        action: "unsubscribed",
        symbol,
        message: `Unsubscribed from ${symbol}`,
      });
    } catch (error) {
      Logger.error(`Error unsubscribing client ${clientId}:`, error);
      this.sendError(clientId, `Failed to unsubscribe: ${error}`);
    }
  }

  broadcastTick(symbol: string, tick: TickMessage): void {
    let broadcastCount = 0;

    for (const [clientId, connection] of this.clients.entries()) {
      if (connection.subscriptions.has(symbol)) {
        if (connection.ws.readyState === WebSocket.OPEN) {
          this.sendMessage(clientId, tick);
          broadcastCount++;
        } else {
          // Clean up closed connections
          this.removeClient(clientId);
        }
      }
    }

    if (broadcastCount > 0) {
      Logger.debug(
        `Broadcasted tick for ${symbol} to ${broadcastCount} clients`
      );
    }
  }

  private sendMessage(clientId: string, message: any): void {
    const connection = this.clients.get(clientId);
    if (!connection) return;

    if (connection.ws.readyState === WebSocket.OPEN) {
      try {
        connection.ws.send(JSON.stringify(message));
      } catch (error) {
        Logger.error(`Error sending message to client ${clientId}:`, error);
        this.removeClient(clientId);
      }
    }
  }

  private sendError(clientId: string, errorMessage: string): void {
    this.sendMessage(clientId, {
      error: errorMessage,
    });
  }

  // Utility methods
  getConnectedClientCount(): number {
    return this.clients.size;
  }

  getClientSubscriptions(clientId: string): string[] {
    const connection = this.clients.get(clientId);
    return connection ? Array.from(connection.subscriptions) : [];
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    for (const [clientId, connection] of this.clients.entries()) {
      if (connection.ws.readyState === WebSocket.OPEN) {
        connection.ws.close(1001, "Server shutting down");
      }
    }
    this.clients.clear();
    Logger.info("Connection manager cleaned up");
  }
}
