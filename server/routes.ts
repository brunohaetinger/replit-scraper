import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { scrapeFundamentus, isLikelyStateOwned } from "./scraper";
import { log } from "./index";

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

  // Scrape endpoint
  app.post('/api/scrape', async (req, res) => {
    try {
      log('Starting scrape process...', 'scraper');
      
      const scrapedStocks = await scrapeFundamentus();
      
      if (scrapedStocks.length === 0) {
        return res.status(500).json({ 
          message: 'No stocks found. The scraper may need to be updated.',
          scraped: 0 
        });
      }

      const today = new Date().toISOString().split('T')[0];
      let stocksCreated = 0;
      let stocksUpdated = 0;
      let fundamentalsCreated = 0;

      // Process each scraped stock
      for (const scraped of scrapedStocks) {
        try {
          // Upsert stock
          const stock = await storage.upsertStock({
            ticker: scraped.ticker,
            name: scraped.name,
            sector: scraped.sector || 'Unknown',
            isStateOwned: isLikelyStateOwned(scraped.name, scraped.ticker),
          });

          // Check if stock was just created or updated
          const existing = await storage.getStock(scraped.ticker);
          if (existing && existing.history.length === 0) {
            stocksCreated++;
          } else {
            stocksUpdated++;
          }

          // Upsert fundamental data for today
          await storage.upsertFundamental({
            ticker: scraped.ticker,
            date: today,
            pl: scraped.pl,
            roe: scraped.roe,
            pvp: scraped.pvp,
            divYield: scraped.divYield,
            netProfit: scraped.netProfit,
            ebitEv: scraped.ebitEv ? 1 / scraped.ebitEv : null, // fundamentus shows EV/EBIT, we store EBIT/EV
            roic: scraped.roic,
          });

          fundamentalsCreated++;
        } catch (e) {
          log(`Error processing stock ${scraped.ticker}: ${e}`, 'scraper');
        }
      }

      log(`Scrape completed: ${scrapedStocks.length} stocks processed`, 'scraper');
      
      res.json({
        message: 'Scraping completed successfully',
        scraped: scrapedStocks.length,
        stocksCreated,
        stocksUpdated,
        fundamentalsCreated,
      });
    } catch (error: any) {
      log(`Scraping failed: ${error.message}`, 'scraper');
      res.status(500).json({ 
        message: 'Failed to scrape data', 
        error: error.message 
      });
    }
  });

  // Seed data on startup (only if no data exists)
  await storage.seedData();

  return httpServer;
}
