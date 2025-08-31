import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { AppError } from "./errorHandler";

// Validation schemas
export const CreateOrderSchema = z.object({
  symbol: z
    .string()
    .regex(
      /^[A-Z0-9-]+$/,
      "Symbol must contain only uppercase letters, numbers, and hyphens"
    ),
  side: z.enum(["BUY", "SELL"]),
  qty: z.number().positive().int("Quantity must be a positive integer"),
  price: z
    .number()
    .positive("Price must be positive")
    .multipleOf(0.01, "Price must have at most 2 decimal places"),
});

export const GetOrdersSchema = z.object({
  symbol: z
    .string()
    .regex(
      /^[A-Z0-9-]+$/,
      "Symbol must contain only uppercase letters, numbers, and hyphens"
    ),
});

export const SubscribeSchema = z.object({
  action: z.literal("subscribe"),
  symbol: z
    .string()
    .regex(
      /^[A-Z0-9-]+$/,
      "Symbol must contain only uppercase letters, numbers, and hyphens"
    ),
});

export const UnsubscribeSchema = z.object({
  action: z.literal("unsubscribe"),
  symbol: z
    .string()
    .regex(
      /^[A-Z0-9-]+$/,
      "Symbol must contain only uppercase letters, numbers, and hyphens"
    ),
});

// Middleware for request validation
export const validateCreateOrder = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    req.body = CreateOrderSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      throw new AppError(400, `Validation failed: ${errorMessages.join(", ")}`);
    }
    throw error;
  }
};

export const validateGetOrders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    req.query = GetOrdersSchema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join(".")}: ${err.message}`
      );
      throw new AppError(400, `Validation failed: ${errorMessages.join(", ")}`);
    }
    throw error;
  }
};
