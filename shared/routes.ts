import { z } from 'zod';
import { insertStockSchema, insertFundamentalSchema, stocks, fundamentals } from './schema';

export const api = {
  stocks: {
    list: {
      method: 'GET' as const,
      path: '/api/stocks',
      input: z.object({
        search: z.string().optional(),
        maxPl: z.coerce.number().optional(),
        minRoe: z.coerce.number().optional(),
        maxPvp: z.coerce.number().optional(),
        minDivYield: z.coerce.number().optional(),
        excludeStateOwned: z.enum(['true', 'false']).optional(),
        sortBy: z.enum(['magic_formula', 'ticker']).optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<any>()), // Returns enriched stock objects
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/stocks/:ticker',
      responses: {
        200: z.custom<any>(), // Stock with history
        404: z.object({ message: z.string() }),
      },
    },
    // For manual data entry/seeding if needed
    create: {
      method: 'POST' as const,
      path: '/api/stocks',
      input: insertStockSchema,
      responses: {
        201: z.custom<typeof stocks.$inferSelect>(),
      }
    },
    addFundamental: {
      method: 'POST' as const,
      path: '/api/fundamentals',
      input: insertFundamentalSchema,
      responses: {
        201: z.custom<typeof fundamentals.$inferSelect>(),
      }
    },
    scrape: {
      method: 'POST' as const,
      path: '/api/scrape',
      responses: {
        200: z.object({
          message: z.string(),
          scraped: z.number(),
          stocksCreated: z.number(),
          stocksUpdated: z.number(),
          fundamentalsCreated: z.number(),
        }),
        500: z.object({
          message: z.string(),
          error: z.string().optional(),
        }),
      }
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
