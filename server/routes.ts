import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/logs", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

    try {
      const logs = await storage.getHttpLogs(startDate, endDate);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
