import { Router } from "express";

export function createHealthRouter(): Router {
  const router = Router();

  // GET /api/health - Health check endpoint
  router.get("/", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  return router;
}
