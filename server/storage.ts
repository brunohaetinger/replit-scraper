import { db } from "./db";
import {
  stocks,
  fundamentals,
  type Stock,
  type InsertStock,
  type InsertFundamental,
  type Fundamental
} from "@shared/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // Stock operations
  getStocks(filters?: {
    search?: string;
    maxPl?: number;
    minRoe?: number;
    maxPvp?: number;
    minDivYield?: number;
    excludeStateOwned?: boolean;
    sortBy?: 'magic_formula' | 'ticker';
  }): Promise<any[]>;
  
  getStock(ticker: string): Promise<{ stock: Stock; history: Fundamental[] } | undefined>;
  
  createStock(stock: InsertStock): Promise<Stock>;
  addFundamental(data: InsertFundamental): Promise<Fundamental>;
  
  // Seed helper
  seedData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getStocks(filters: {
    search?: string;
    maxPl?: number;
    minRoe?: number;
    maxPvp?: number;
    minDivYield?: number;
    excludeStateOwned?: boolean;
    sortBy?: 'magic_formula' | 'ticker';
  } = {}) {
    // This is a complex query to get the LATEST fundamentals for filtering
    // In a real app, we might use a view or a window function.
    // For simplicity with Drizzle/MVP, we'll fetch all stocks and their latest fundamental
    
    // 1. Get all stocks
    let query = db.select().from(stocks);
    
    // 2. Apply stock-level filters
    const conditions = [];
    if (filters.search) {
      conditions.push(sql`(${stocks.ticker} ILIKE ${`%${filters.search}%`} OR ${stocks.name} ILIKE ${`%${filters.search}%`})`);
    }
    if (filters.excludeStateOwned) {
      conditions.push(eq(stocks.isStateOwned, false));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const allStocks = await query;
    const results = [];

    // 3. For each stock, get latest fundamental and apply metric filters
    // Note: In production this would be 1 JOIN query.
    for (const stock of allStocks) {
      const history = await db.select()
        .from(fundamentals)
        .where(eq(fundamentals.ticker, stock.ticker))
        .orderBy(desc(fundamentals.date))
        .limit(1);
        
      const latest = history[0];
      
      if (!latest) continue; // Skip if no data
      
      // Apply Metric Filters
      if (filters.maxPl !== undefined && (latest.pl === null || latest.pl > filters.maxPl)) continue;
      if (filters.minRoe !== undefined && (latest.roe === null || latest.roe < filters.minRoe)) continue;
      if (filters.maxPvp !== undefined && (latest.pvp === null || latest.pvp > filters.maxPvp)) continue;
      if (filters.minDivYield !== undefined && (latest.divYield === null || latest.divYield < filters.minDivYield)) continue;
      
      results.push({ ...stock, latest });
    }
    
    // 4. Sort
    if (filters.sortBy === 'magic_formula') {
        // Magic Formula: Rank by ROIC (desc) and EBIT/EV (desc)
        // Simple implementation: Sum of ranks
        
        // Sort by ROIC
        results.sort((a, b) => (b.latest?.roic || 0) - (a.latest?.roic || 0));
        const roicRank = new Map(results.map((s, i) => [s.ticker, i + 1]));
        
        // Sort by EBIT/EV
        results.sort((a, b) => (b.latest?.ebitEv || 0) - (a.latest?.ebitEv || 0));
        const ebitRank = new Map(results.map((s, i) => [s.ticker, i + 1]));
        
        // Combine Ranks (Lower is better)
        results.forEach(s => {
            s.magicRank = (roicRank.get(s.ticker) || 0) + (ebitRank.get(s.ticker) || 0);
        });
        
        results.sort((a, b) => a.magicRank - b.magicRank);
    } else {
        results.sort((a, b) => a.ticker.localeCompare(b.ticker));
    }
    
    return results;
  }

  async getStock(ticker: string) {
    const stock = await db.select().from(stocks).where(eq(stocks.ticker, ticker)).limit(1);
    if (!stock.length) return undefined;
    
    const history = await db.select()
      .from(fundamentals)
      .where(eq(fundamentals.ticker, ticker))
      .orderBy(sql`${fundamentals.date} ASC`);
      
    return { stock: stock[0], history };
  }

  async createStock(stock: InsertStock) {
    const [res] = await db.insert(stocks).values(stock).returning();
    return res;
  }

  async addFundamental(data: InsertFundamental) {
    const [res] = await db.insert(fundamentals).values(data).returning();
    return res;
  }
  
  async seedData() {
    const existing = await this.getStocks();
    if (existing.length > 0) return;

    // Seed some Brazilian market examples
    // WEGE3 (Good fundamentals, usually expensive P/L)
    await this.createStock({ ticker: "WEGE3", name: "Weg S.A.", sector: "Industrial", isStateOwned: false });
    // VALE3 (Commodity, volatile but high cash flow)
    await this.createStock({ ticker: "VALE3", name: "Vale S.A.", sector: "Mining", isStateOwned: false });
    // PETR4 (State owned, high dividend, low P/L)
    await this.createStock({ ticker: "PETR4", name: "Petrobras", sector: "Oil & Gas", isStateOwned: true });
    // BBAS3 (State owned, good metrics)
    await this.createStock({ ticker: "BBAS3", name: "Banco do Brasil", sector: "Banking", isStateOwned: true });
    // EGIE3 (Utilities, stable)
    await this.createStock({ ticker: "EGIE3", name: "Engie Brasil", sector: "Utilities", isStateOwned: false });

    const tickers = ["WEGE3", "VALE3", "PETR4", "BBAS3", "EGIE3"];
    
    // Generate 3 years of quarterly data
    const years = [2022, 2023, 2024];
    const quarters = [1, 2, 3, 4];
    
    for (const ticker of tickers) {
        let baseNetProfit = Math.random() * 1000 + 500;
        let baseRoe = 15;
        
        for (const year of years) {
            for (const q of quarters) {
                // Trends
                if (ticker === "WEGE3") { 
                    baseNetProfit *= 1.05; // Growing
                    baseRoe = 20 + Math.random() * 2;
                } else if (ticker === "VALE3") {
                    baseNetProfit += (Math.random() - 0.5) * 500; // Volatile
                    baseRoe = 25 + Math.random() * 10;
                }
                
                await this.addFundamental({
                    ticker,
                    date: `${year}-${String(q * 3).padStart(2, '0')}-01`,
                    pl: ticker === "WEGE3" ? 25 : 5, // WEGE expensive, others cheap
                    roe: baseRoe,
                    pvp: ticker === "WEGE3" ? 5 : 1.2,
                    divYield: ticker === "PETR4" ? 15 : (ticker === "WEGE3" ? 2 : 8),
                    netProfit: baseNetProfit,
                    ebitEv: ticker === "WEGE3" ? 0.05 : 0.20, // High yield for cheap stocks
                    roic: baseRoe - 2,
                });
            }
        }
    }
  }
}

export const storage = new DatabaseStorage();
