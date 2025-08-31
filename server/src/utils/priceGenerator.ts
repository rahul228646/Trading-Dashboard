import { Symbol } from "../types/trading";

export class PriceGenerator {
  private priceHistory: Map<string, number[]> = new Map();
  private readonly historySize = 10;

  generateRealisticPrice(
    symbol: string,
    basePrice: number,
    volatility: number = 0.05
  ): number {
    const history = this.priceHistory.get(symbol) || [];

    // Calculate trend momentum from recent prices
    let trendFactor = 0;
    if (history.length >= 2) {
      const recent = history.slice(-3);
      const trend = recent.reduce((acc, price, index) => {
        if (index === 0) return acc;
        return acc + (price - recent[index - 1]);
      }, 0);
      trendFactor = Math.max(-0.02, Math.min(0.02, trend / basePrice));
    }

    // Generate random price change with trend influence
    const randomFactor = (Math.random() - 0.5) * 2; // -1 to 1
    const priceChange =
      basePrice * volatility * randomFactor + basePrice * trendFactor;

    let newPrice = basePrice + priceChange;

    // Ensure price stays within ±5% of original close price
    const minPrice = basePrice * (1 - volatility);
    const maxPrice = basePrice * (1 + volatility);
    newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

    // Round to 2 decimal places for stocks, more for crypto
    const precision = symbol.includes("USD") && basePrice < 1 ? 4 : 2;
    newPrice = Number(newPrice.toFixed(precision));

    // Update price history
    history.push(newPrice);
    if (history.length > this.historySize) {
      history.shift();
    }
    this.priceHistory.set(symbol, history);

    return newPrice;
  }

  generateVolume(symbol: string): number {
    let baseVolume: number;

    // Different volume ranges based on symbol type
    if (symbol.includes("BTC")) {
      baseVolume = Math.random() * 50 + 10; // 10-60
    } else if (symbol.includes("ETH")) {
      baseVolume = Math.random() * 200 + 50; // 50-250
    } else if (symbol.includes("USD")) {
      baseVolume = Math.random() * 10000 + 1000; // 1000-11000 (crypto)
    } else {
      baseVolume = Math.random() * 500 + 100; // 100-600 (stocks)
    }

    return Math.floor(baseVolume);
  }

  getRandomTickInterval(min: number = 1000, max: number = 2000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
