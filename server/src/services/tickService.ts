import { Tick } from "../types/trading";
import { SymbolService } from "./symbolService";
import { PriceGenerator } from "../utils/priceGenerator";
import { Logger } from "../utils/logger";
import { CONFIG } from "../config/constants";

export class TickService {
  private symbolService: SymbolService;
  private priceGenerator: PriceGenerator;
  private activeIntervals: Map<string, NodeJS.Timeout> = new Map();
  private subscribers: Map<string, Set<string>> = new Map(); // symbol -> clientIds
  private currentPrices: Map<string, number> = new Map();
  private tickHistory: Map<string, Tick[]> = new Map(); // symbol -> tick history
  private readonly MAX_HISTORY_SIZE = 1000;

  constructor(symbolService: SymbolService) {
    this.symbolService = symbolService;
    this.priceGenerator = new PriceGenerator();
  }

  addSubscriber(clientId: string, symbol: string): void {
    const upperSymbol = symbol.toUpperCase();

    // Validate symbol exists
    if (!this.symbolService.validateSymbolExists(upperSymbol)) {
      throw new Error(`Symbol ${upperSymbol} not found`);
    }

    // Add client to subscribers
    if (!this.subscribers.has(upperSymbol)) {
      this.subscribers.set(upperSymbol, new Set());
    }
    this.subscribers.get(upperSymbol)!.add(clientId);

    // Start ticking if this is the first subscriber
    if (this.subscribers.get(upperSymbol)!.size === 1) {
      this.startTicking(upperSymbol);
    }

    // Send current price immediately if available
    const currentPrice = this.currentPrices.get(upperSymbol);
    if (currentPrice) {
      const tick = this.generateTick(upperSymbol, currentPrice);
      Logger.debug(
        `Sending current price to new subscriber ${clientId}:`,
        tick
      );
    }

    Logger.info(`Client ${clientId} subscribed to ${upperSymbol}`);
  }

  removeSubscriber(clientId: string, symbol?: string): void {
    if (symbol) {
      const upperSymbol = symbol.toUpperCase();
      const symbolSubscribers = this.subscribers.get(upperSymbol);

      if (symbolSubscribers) {
        symbolSubscribers.delete(clientId);

        // Stop ticking if no more subscribers
        if (symbolSubscribers.size === 0) {
          this.stopTicking(upperSymbol);
          this.subscribers.delete(upperSymbol);
        }
      }

      Logger.info(`Client ${clientId} unsubscribed from ${upperSymbol}`);
    } else {
      // Remove client from all subscriptions
      for (const [sym, clientIds] of this.subscribers.entries()) {
        clientIds.delete(clientId);

        if (clientIds.size === 0) {
          this.stopTicking(sym);
          this.subscribers.delete(sym);
        }
      }

      Logger.info(`Client ${clientId} removed from all subscriptions`);
    }
  }

  private startTicking(symbol: string): void {
    if (this.activeIntervals.has(symbol)) {
      return; // Already ticking
    }

    const closePrice = this.symbolService.getClosePrice(symbol);
    this.currentPrices.set(symbol, closePrice);

    const generateAndBroadcast = () => {
      const currentPrice = this.currentPrices.get(symbol) || closePrice;
      const tick = this.generateTick(symbol, currentPrice);
      this.currentPrices.set(symbol, tick.price);

      // Store tick in history
      this.addTickToHistory(symbol, tick);

      // Broadcast to all subscribers (handled by connection manager)
      this.broadcastTick(symbol, tick);

      // Schedule next tick with random interval
      const nextInterval = this.priceGenerator.getRandomTickInterval(
        CONFIG.TICK_INTERVAL_MIN,
        CONFIG.TICK_INTERVAL_MAX
      );

      const timeout = setTimeout(generateAndBroadcast, nextInterval);
      this.activeIntervals.set(symbol, timeout);
    };

    // Start first tick immediately
    generateAndBroadcast();
    Logger.info(`Started ticking for ${symbol}`);
  }

  private stopTicking(symbol: string): void {
    const interval = this.activeIntervals.get(symbol);
    if (interval) {
      clearTimeout(interval);
      this.activeIntervals.delete(symbol);
      Logger.info(`Stopped ticking for ${symbol}`);
    }
  }

  private generateTick(symbol: string, basePrice: number): Tick {
    const price = this.priceGenerator.generateRealisticPrice(
      symbol,
      basePrice,
      CONFIG.TICK_VARIANCE_PERCENT
    );

    const volume = this.priceGenerator.generateVolume(symbol);

    return {
      symbol,
      price,
      volume,
      timestamp: Math.floor(Date.now() / 1000),
    };
  }

  private broadcastTick(symbol: string, tick: Tick): void {
    // This will be called by the connection manager
    // For now, just log the tick
    Logger.debug(`Generated tick for ${symbol}:`, tick);
  }

  // Method to be called by connection manager to broadcast ticks
  setBroadcastCallback(callback: (symbol: string, tick: Tick) => void): void {
    this.broadcastTick = callback;
  }

  getActiveSubscriptions(): string[] {
    return Array.from(this.subscribers.keys());
  }

  getSubscriberCount(symbol: string): number {
    return this.subscribers.get(symbol.toUpperCase())?.size || 0;
  }

  getCurrentPrice(symbol: string): number | undefined {
    return this.currentPrices.get(symbol.toUpperCase());
  }

  getLatestTick(symbol: string): Tick | null {
    const upperSymbol = symbol.toUpperCase();
    const history = this.tickHistory.get(upperSymbol);
    if (!history || history.length === 0) {
      return null;
    }
    return history[history.length - 1];
  }

  getTickHistory(symbol: string, limit: number = 100): Tick[] {
    const upperSymbol = symbol.toUpperCase();
    const history = this.tickHistory.get(upperSymbol) || [];
    const actualLimit = Math.min(limit, history.length);
    return history.slice(-actualLimit);
  }

  private addTickToHistory(symbol: string, tick: Tick): void {
    const upperSymbol = symbol.toUpperCase();
    if (!this.tickHistory.has(upperSymbol)) {
      this.tickHistory.set(upperSymbol, []);
    }

    const history = this.tickHistory.get(upperSymbol)!;
    history.push(tick);

    // Keep only the last MAX_HISTORY_SIZE ticks
    if (history.length > this.MAX_HISTORY_SIZE) {
      history.shift();
    }
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    for (const symbol of this.activeIntervals.keys()) {
      this.stopTicking(symbol);
    }
    this.subscribers.clear();
    this.currentPrices.clear();
    Logger.info("Tick service cleaned up");
  }
}
