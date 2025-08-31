import rateLimit from "express-rate-limit";
import { CONFIG } from "../config/constants";

export const orderRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: CONFIG.ORDER_RATE_LIMIT, // limit each IP to X requests per windowMs
  message: {
    error: "Too many orders submitted, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
