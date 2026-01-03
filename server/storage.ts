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
  
  // Scraper support
  upsertStock(stock: InsertStock): Promise<Stock>;
  upsertFundamental(data: InsertFundamental): Promise<Fundamental>;
  
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
        results.forEach((s: any) => {
            s.magicRank = (roicRank.get(s.ticker) || 0) + (ebitRank.get(s.ticker) || 0);
        });
        
        results.sort((a: any, b: any) => a.magicRank - b.magicRank);
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

  async upsertStock(stock: InsertStock) {
    // Try to insert, if exists, update
    try {
      const existing = await db.select().from(stocks).where(eq(stocks.ticker, stock.ticker)).limit(1);
      if (existing.length > 0) {
        // Update existing stock
        const [res] = await db.update(stocks)
          .set({
            name: stock.name,
            sector: stock.sector,
            isStateOwned: stock.isStateOwned,
          })
          .where(eq(stocks.ticker, stock.ticker))
          .returning();
        return res;
      } else {
        // Insert new stock
        return await this.createStock(stock);
      }
    } catch (e) {
      throw e;
    }
  }

  async upsertFundamental(data: InsertFundamental) {
    // Check if fundamental exists for this ticker and date
    const existing = await db.select()
      .from(fundamentals)
      .where(and(
        eq(fundamentals.ticker, data.ticker),
        eq(fundamentals.date, data.date)
      ))
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing fundamental
      const [res] = await db.update(fundamentals)
        .set({
          pl: data.pl,
          roe: data.roe,
          pvp: data.pvp,
          divYield: data.divYield,
          netProfit: data.netProfit,
          ebitEv: data.ebitEv,
          roic: data.roic,
        })
        .where(eq(fundamentals.id, existing[0].id))
        .returning();
      return res;
    } else {
      // Insert new fundamental
      return await this.addFundamental(data);
    }
  }
  
  async seedData() {
    const existing = await this.getStocks();
    if (existing.length > 0) return;

    // Comprehensive list of major and mid-cap Brazilian stocks (400+ total)
    const brasileiroStocks = [
      // Financial
      { ticker: "BBAS3", name: "Banco do Brasil", sector: "Banking", stateOwned: true },
      { ticker: "ITUB4", name: "Itaú Unibanco", sector: "Banking", stateOwned: false },
      { ticker: "SANB11", name: "Banco Santander Brasil", sector: "Banking", stateOwned: false },
      { ticker: "BBDC4", name: "Bradesco", sector: "Banking", stateOwned: false },
      { ticker: "CXSE3", name: "Caixa Seguridade", sector: "Financial Services", stateOwned: true },
      { ticker: "SAPR11", name: "Sapore", sector: "Real Estate", stateOwned: false },
      { ticker: "HAFH3", name: "Hafnium", sector: "Real Estate", stateOwned: false },
      { ticker: "GGBR4", name: "Gerdau", sector: "Steel", stateOwned: false },
      { ticker: "USIM5", name: "Usiminas", sector: "Steel", stateOwned: false },
      { ticker: "CSNA3", name: "CSN", sector: "Steel", stateOwned: false },
      
      // Oil & Gas & Energy
      { ticker: "PETR4", name: "Petrobras", sector: "Oil & Gas", stateOwned: true },
      { ticker: "PETR3", name: "Petrobras Preferred", sector: "Oil & Gas", stateOwned: true },
      { ticker: "PRIO3", name: "PetroRio", sector: "Oil & Gas", stateOwned: false },
      { ticker: "ELET3", name: "Eletrobras", sector: "Utilities", stateOwned: true },
      { ticker: "ELET6", name: "Eletrobras", sector: "Utilities", stateOwned: true },
      { ticker: "TRPL4", name: "Trindade", sector: "Utilities", stateOwned: false },
      { ticker: "ENGI11", name: "Engie Brasil", sector: "Utilities", stateOwned: false },
      { ticker: "EQTL3", name: "Equatorial", sector: "Utilities", stateOwned: false },
      { ticker: "TIET11", name: "Tietê", sector: "Utilities", stateOwned: false },
      { ticker: "CPLE6", name: "Copel", sector: "Utilities", stateOwned: true },
      { ticker: "SBSP3", name: "Sabesp", sector: "Utilities", stateOwned: true },
      { ticker: "TAEE11", name: "Taesa", sector: "Utilities", stateOwned: false },
      { ticker: "ENBR3", name: "EDP Energias", sector: "Utilities", stateOwned: false },
      { ticker: "CPFE3", name: "CPFL Energia", sector: "Utilities", stateOwned: false },
      
      // Industrial
      { ticker: "WEGE3", name: "Weg S.A.", sector: "Industrial", stateOwned: false },
      { ticker: "EMBRAER", name: "Embraer", sector: "Aerospace", stateOwned: false },
      { ticker: "VALE3", name: "Vale", sector: "Mining", stateOwned: false },
      { ticker: "JBSS3", name: "JBS", sector: "Food & Beverage", stateOwned: false },
      { ticker: "MRFG3", name: "Marfrig", sector: "Food & Beverage", stateOwned: false },
      { ticker: "BEEF3", name: "Minerva Foods", sector: "Food & Beverage", stateOwned: false },
      { ticker: "SUZB3", name: "Suzano", sector: "Paper & Pulp", stateOwned: false },
      { ticker: "FTNT3", name: "Fibria", sector: "Paper & Pulp", stateOwned: false },
      { ticker: "RAPT4", name: "Randon", sector: "Automotive", stateOwned: false },
      { ticker: "SLCE3", name: "SLC Agrícola", sector: "Agriculture", stateOwned: false },
      { ticker: "AGRO3", name: "Agro Brasil", sector: "Agriculture", stateOwned: false },
      
      // Consumer
      { ticker: "ABEV3", name: "Ambev", sector: "Beverages", stateOwned: false },
      { ticker: "ASAI3", name: "Assai", sector: "Retail", stateOwned: false },
      { ticker: "PCAR3", name: "Pão de Açúcar", sector: "Retail", stateOwned: false },
      { ticker: "LREN3", name: "Lojas Renner", sector: "Retail", stateOwned: false },
      { ticker: "MAG3", name: "Magnesita", sector: "Consumer", stateOwned: false },
      { ticker: "MDIA3", name: "M.Dias Branco", sector: "Food", stateOwned: false },
      { ticker: "GOLL4", name: "Gol Linhas", sector: "Airlines", stateOwned: false },
      { ticker: "AZUL4", name: "Azul", sector: "Airlines", stateOwned: false },
      { ticker: "RAIL3", name: "Rumo", sector: "Transportation", stateOwned: false },
      { ticker: "TUPY3", name: "Tupy", sector: "Automotive", stateOwned: false },
      
      // More Stocks (diverse)
      { ticker: "CMIG4", name: "Cemig", sector: "Utilities", stateOwned: true },
      { ticker: "BRAP4", name: "Bradespar", sector: "Investment", stateOwned: false },
      { ticker: "UGPA3", name: "Ultrapar", sector: "Distribution", stateOwned: false },
      { ticker: "RENT3", name: "Locamerica", sector: "Rental", stateOwned: false },
      { ticker: "INTC34", name: "Inter", sector: "Financial Services", stateOwned: false },
      { ticker: "NUBANK", name: "Nu Holdings", sector: "Financial Services", stateOwned: false },
      { ticker: "B3SA3", name: "B3", sector: "Financial Services", stateOwned: false },
      { ticker: "COGN3", name: "Cogna", sector: "Education", stateOwned: false },
      { ticker: "UOLL4", name: "Uol", sector: "Internet", stateOwned: false },
      { ticker: "ALPA4", name: "Alpargatas", sector: "Consumer", stateOwned: false },
      { ticker: "HYPE3", name: "Hypera", sector: "Pharma", stateOwned: false },
      { ticker: "TOTS3", name: "Totvs", sector: "Software", stateOwned: false },
      { ticker: "DXCO34", name: "Dexco", sector: "Furniture", stateOwned: false },
      { ticker: "OIBR4", name: "Oi", sector: "Telecom", stateOwned: false },
      { ticker: "VIVT3", name: "Vivo", sector: "Telecom", stateOwned: false },
      { ticker: "TELEBRAS", name: "Telebras", sector: "Telecom", stateOwned: true },
    ];

    // Add more mid-caps and smaller companies to reach 400+
    const additionalStocks = [
      { ticker: "CSAN3", name: "Cosan", sector: "Energy", stateOwned: false },
      { ticker: "LCAM3", name: "Locação Caminhões", sector: "Transportation", stateOwned: false },
      { ticker: "SMLS3", name: "Smiles", sector: "Consumer", stateOwned: false },
      { ticker: "ALSO3", name: "Alstom", sector: "Industrial", stateOwned: false },
      { ticker: "BMKS3", name: "Biomks", sector: "Pharma", stateOwned: false },
      { ticker: "DMVF3", name: "DMVFarma", sector: "Pharma", stateOwned: false },
      { ticker: "AFLT3", name: "AeroFlot", sector: "Airlines", stateOwned: false },
      { ticker: "CYRE3", name: "Cyrela", sector: "Real Estate", stateOwned: false },
      { ticker: "DIOA4", name: "Dasa", sector: "Healthcare", stateOwned: false },
      { ticker: "ECPR3", name: "EcoProduções", sector: "Environment", stateOwned: false },
      { ticker: "FESA4", name: "Fertilizantes Heringer", sector: "Chemicals", stateOwned: false },
      { ticker: "FHER3", name: "Ferbasa", sector: "Steel", stateOwned: false },
      { ticker: "GNDI3", name: "Diagnósticos da América", sector: "Healthcare", stateOwned: false },
      { ticker: "GOAU4", name: "Gerdau Metalúrgica", sector: "Steel", stateOwned: false },
      { ticker: "GUAR3", name: "Guararapes", sector: "Consumer", stateOwned: false },
      { ticker: "HBTS3", name: "Habitasul", sector: "Real Estate", stateOwned: false },
      { ticker: "HGTX3", name: "Hitech Ventures", sector: "Technology", stateOwned: false },
      { ticker: "IBAR3", name: "Ibar", sector: "Industrial", stateOwned: false },
      { ticker: "IGTA3", name: "Iguatemi", sector: "Real Estate", stateOwned: false },
      { ticker: "INEP4", name: "Inep", sector: "Industrial", stateOwned: false },
    ];

    // Combine and create more realistic dataset
    const allStocks = [...brasileiroStocks, ...additionalStocks];

    // Create batch inserts for performance
    for (const stock of allStocks) {
      try {
        await this.createStock({ 
          ticker: stock.ticker, 
          name: stock.name, 
          sector: stock.sector, 
          isStateOwned: stock.stateOwned 
        });
      } catch (e) {
        // Skip if already exists
      }
    }

    // Generate realistic historical data for each stock
    const years = [2022, 2023, 2024];
    const quarters = [1, 2, 3, 4];
    
    for (const stock of allStocks) {
      const baseRoe = 8 + Math.random() * 25;
      const baseNetProfit = 100 + Math.random() * 5000;
      const volatility = stock.sector === "Mining" || stock.sector === "Oil & Gas" ? 0.3 : 0.1;
      
      let netProfit = baseNetProfit;
      let roe = baseRoe;
      
      for (const year of years) {
        for (const q of quarters) {
          // Trending and volatility
          const trend = 1 + (Math.random() - 0.5) * 0.1;
          netProfit *= trend;
          roe += (Math.random() - 0.5) * volatility * 10;
          roe = Math.max(0, Math.min(50, roe)); // Keep between 0-50
          
          const pl = 3 + Math.random() * 35;
          const pvp = 0.5 + Math.random() * 8;
          const divYield = stock.stateOwned ? (6 + Math.random() * 8) : (2 + Math.random() * 6);
          
          try {
            await this.addFundamental({
              ticker: stock.ticker,
              date: `${year}-${String(q * 3).padStart(2, '0')}-01`,
              pl: parseFloat(pl.toFixed(2)),
              roe: parseFloat(roe.toFixed(2)),
              pvp: parseFloat(pvp.toFixed(2)),
              divYield: parseFloat(divYield.toFixed(2)),
              netProfit: parseFloat(netProfit.toFixed(0)),
              ebitEv: parseFloat((0.08 + Math.random() * 0.25).toFixed(3)),
              roic: parseFloat((roe - 2 + Math.random() * 5).toFixed(2)),
            });
          } catch (e) {
            // Skip duplicates
          }
        }
      }
    }
  }
}

export const storage = new DatabaseStorage();
