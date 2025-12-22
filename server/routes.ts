import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.stocks.list.path, async (req, res) => {
    try {
        const filters = {
            search: req.query.search as string,
            maxPl: req.query.maxPl ? Number(req.query.maxPl) : undefined,
            minRoe: req.query.minRoe ? Number(req.query.minRoe) : undefined,
            maxPvp: req.query.maxPvp ? Number(req.query.maxPvp) : undefined,
            minDivYield: req.query.minDivYield ? Number(req.query.minDivYield) : undefined,
            excludeStateOwned: req.query.excludeStateOwned === 'true',
            sortBy: req.query.sortBy as any,
        };
        const stocks = await storage.getStocks(filters);
        res.json(stocks);
    } catch (e) {
        res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.stocks.get.path, async (req, res) => {
    const data = await storage.getStock(req.params.ticker);
    if (!data) {
      return res.status(404).json({ message: 'Stock not found' });
    }
    res.json(data);
  });

  // Seed data on startup
  await storage.seedData();

  return httpServer;
}
