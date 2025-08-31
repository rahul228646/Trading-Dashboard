import { describe, it, expect } from "vitest";

// Test the validation logic independently of the component
describe("Order Validation Logic - SDE1 Assignment Requirement #4", () => {
  const AAPL_CLOSE_PRICE = 180.12;
  const PRICE_VARIANCE = 0.2; // ±20%

  // Calculate valid price range
  const minPrice = AAPL_CLOSE_PRICE * (1 - PRICE_VARIANCE); // 144.096
  const maxPrice = AAPL_CLOSE_PRICE * (1 + PRICE_VARIANCE); // 216.144

  const validateOrderPrice = (
    price: number,
    closePrice: number,
    variance: number = 0.2
  ) => {
    const min = closePrice * (1 - variance);
    const max = closePrice * (1 + variance);
    return price >= min && price <= max;
  };

  const validateOrderQuantity = (qty: number) => {
    return qty > 0;
  };

  const validateOrderData = (orderData: {
    qty: number;
    price: number;
    symbol: string;
  }) => {
    const errors: string[] = [];

    if (!validateOrderQuantity(orderData.qty)) {
      errors.push("Quantity must be greater than 0");
    }

    if (orderData.price <= 0) {
      errors.push("Price must be greater than 0");
    }

    if (!validateOrderPrice(orderData.price, AAPL_CLOSE_PRICE)) {
      errors.push(
        `Price must be within ±20% of ${orderData.symbol} close price`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  describe("Price Range Validation - ±20% Rule", () => {
    it("should reject price above +20% of close price", () => {
      const invalidPrice = maxPrice + 1; // Above +20%
      const isValid = validateOrderPrice(invalidPrice, AAPL_CLOSE_PRICE);
      expect(isValid).toBe(false);
    });

    it("should reject price below -20% of close price", () => {
      const invalidPrice = minPrice - 1; // Below -20%
      const isValid = validateOrderPrice(invalidPrice, AAPL_CLOSE_PRICE);
      expect(isValid).toBe(false);
    });

    it("should accept price exactly at +20% boundary", () => {
      const isValid = validateOrderPrice(maxPrice, AAPL_CLOSE_PRICE);
      expect(isValid).toBe(true);
    });

    it("should accept price exactly at -20% boundary", () => {
      const isValid = validateOrderPrice(minPrice, AAPL_CLOSE_PRICE);
      expect(isValid).toBe(true);
    });

    it("should accept price within valid range", () => {
      const validPrice = AAPL_CLOSE_PRICE; // Exactly at close price
      const isValid = validateOrderPrice(validPrice, AAPL_CLOSE_PRICE);
      expect(isValid).toBe(true);
    });

    it("should calculate correct price range for different symbols", () => {
      const MSFT_CLOSE_PRICE = 323.45;
      const msftMin = MSFT_CLOSE_PRICE * 0.8; // 258.76
      const msftMax = MSFT_CLOSE_PRICE * 1.2; // 388.14

      expect(validateOrderPrice(msftMin, MSFT_CLOSE_PRICE)).toBe(true);
      expect(validateOrderPrice(msftMax, MSFT_CLOSE_PRICE)).toBe(true);
      expect(validateOrderPrice(msftMin - 1, MSFT_CLOSE_PRICE)).toBe(false);
      expect(validateOrderPrice(msftMax + 1, MSFT_CLOSE_PRICE)).toBe(false);
    });
  });

  describe("Quantity Validation", () => {
    it("should reject quantity of 0", () => {
      const isValid = validateOrderQuantity(0);
      expect(isValid).toBe(false);
    });

    it("should reject negative quantity", () => {
      const isValid = validateOrderQuantity(-5);
      expect(isValid).toBe(false);
    });

    it("should accept positive quantity", () => {
      const isValid = validateOrderQuantity(100);
      expect(isValid).toBe(true);
    });

    it("should accept fractional quantity", () => {
      const isValid = validateOrderQuantity(0.5);
      expect(isValid).toBe(true);
    });
  });

  describe("Complete Order Validation", () => {
    it("should reject order with invalid quantity", () => {
      const orderData = {
        qty: 0,
        price: 180.0,
        symbol: "AAPL",
      };

      const validation = validateOrderData(orderData);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Quantity must be greater than 0");
    });

    it("should reject order with invalid price (≤ 0)", () => {
      const orderData = {
        qty: 100,
        price: 0,
        symbol: "AAPL",
      };

      const validation = validateOrderData(orderData);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain("Price must be greater than 0");
    });

    it("should reject order with price outside ±20% range", () => {
      const orderData = {
        qty: 100,
        price: 250.0, // Above +20%
        symbol: "AAPL",
      };

      const validation = validateOrderData(orderData);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toContain(
        "Price must be within ±20% of AAPL close price"
      );
    });

    it("should accept completely valid order", () => {
      const orderData = {
        qty: 100,
        price: 180.0,
        symbol: "AAPL",
      };

      const validation = validateOrderData(orderData);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should accumulate multiple validation errors", () => {
      const orderData = {
        qty: -5, // Invalid quantity
        price: -10, // Invalid price (≤ 0)
        symbol: "AAPL",
      };

      const validation = validateOrderData(orderData);
      expect(validation.valid).toBe(false);
      expect(validation.errors).toHaveLength(3); // qty error + price ≤ 0 error + price range error
      expect(validation.errors).toContain("Quantity must be greater than 0");
      expect(validation.errors).toContain("Price must be greater than 0");
      expect(validation.errors).toContain(
        "Price must be within ±20% of AAPL close price"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle very small close prices correctly", () => {
      const DOGE_CLOSE_PRICE = 0.076; // Dogecoin example
      const validPrice = DOGE_CLOSE_PRICE * 1.1; // +10% should be valid

      expect(validateOrderPrice(validPrice, DOGE_CLOSE_PRICE)).toBe(true);
    });

    it("should handle very large close prices correctly", () => {
      const BTC_CLOSE_PRICE = 29000.0; // Bitcoin example
      const validPrice = BTC_CLOSE_PRICE * 0.9; // -10% should be valid

      expect(validateOrderPrice(validPrice, BTC_CLOSE_PRICE)).toBe(true);
    });

    it("should handle decimal precision correctly", () => {
      const price = 180.123456789;
      const closePrice = 180.12;

      // Should work with floating point precision
      expect(validateOrderPrice(price, closePrice)).toBe(true);
    });
  });
});
