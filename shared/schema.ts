import { pgTable, text, serial, boolean, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===
export const stocks = pgTable("stocks", {
  ticker: text("ticker").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector"),
  subsector: text("subsector"),
  isStateOwned: boolean("is_state_owned").default(false),
});

export const fundamentals = pgTable("fundamentals", {
  id: serial("id").primaryKey(),
  ticker: text("ticker").notNull(),
  date: date("date").notNull(), // Snapshot date for historical analysis
  
  // Basic Analysis
  pl: real("p_l"),          // P/L
  roe: real("roe"),         // ROE
  pvp: real("p_vp"),        // P/VP
  divYield: real("div_yield"), // Dividend Yield %
  netProfit: real("net_profit"), // Net Profit (absolute or scaled)
  
  // Magic Formula
  ebitEv: real("ebit_ev"),   // EBIT/EV
  roic: real("roic"),        // ROIC
});

// === SCHEMAS ===
export const insertStockSchema = createInsertSchema(stocks);
export const insertFundamentalSchema = createInsertSchema(fundamentals).omit({ id: true });

// === TYPES ===
export type Stock = typeof stocks.$inferSelect;
export type Fundamental = typeof fundamentals.$inferSelect;
export type InsertStock = z.infer<typeof insertStockSchema>;
export type InsertFundamental = z.infer<typeof insertFundamentalSchema>;

// Request Types
export type FilterRequest = {
  maxPl?: number;
  minRoe?: number;
  maxPvp?: number;
  minDivYield?: number;
  excludeStateOwned?: boolean;
};

// Response Types
export type StockWithLatestFundamental = Stock & {
  latest: Fundamental | null;
};

export type MagicFormulaRanked = StockWithLatestFundamental & {
  magicFormulaRank: number;
};
