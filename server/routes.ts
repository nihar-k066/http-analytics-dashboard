import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
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

  // Setup WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');

    // Send initial data
    const sendInitialData = async () => {
      if (ws.readyState === WebSocket.OPEN) {
        const logs = await storage.getHttpLogs(
          new Date(Date.now() - 24 * 60 * 60 * 1000),
          new Date()
        );
        ws.send(JSON.stringify({ type: 'initial', data: logs }));
      }
    };
    sendInitialData();

    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
  });

  // Add method to broadcast updates to all connected clients
  storage.onNewLog = (log) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'update', data: log }));
      }
    });
  };

  return httpServer;
}