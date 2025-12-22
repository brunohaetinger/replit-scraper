import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type InsertStock, type InsertFundamental } from "@shared/routes";
import { z } from "zod";

// Filter params type derived from API schema input
type StockFilterParams = {
  search?: string;
  maxPl?: number;
  minRoe?: number;
  maxPvp?: number;
  minDivYield?: number;
  excludeStateOwned?: boolean; // We handle string conversion in the hook
  sortBy?: 'magic_formula' | 'ticker';
};

export function useStocks(filters: StockFilterParams) {
  // Convert boolean to string for API query param if needed, or pass matching schema
  const queryParams: Record<string, any> = { ...filters };
  
  // Clean up undefined values
  Object.keys(queryParams).forEach(key => 
    queryParams[key] === undefined && delete queryParams[key]
  );
  
  // Specific transform for boolean param -> string 'true'/'false' if API expects enum
  if (filters.excludeStateOwned !== undefined) {
    queryParams.excludeStateOwned = String(filters.excludeStateOwned);
  }

  // Construct query key that includes all filters
  const queryKey = [api.stocks.list.path, queryParams];
  
  // Construct URL with params
  const urlParams = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    urlParams.append(key, String(value));
  });

  return useQuery({
    queryKey,
    queryFn: async () => {
      const res = await fetch(`${api.stocks.list.path}?${urlParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch stocks");
      return api.stocks.list.responses[200].parse(await res.json());
    },
  });
}

export function useStock(ticker: string) {
  return useQuery({
    queryKey: [api.stocks.get.path, ticker],
    queryFn: async () => {
      const url = buildUrl(api.stocks.get.path, { ticker });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch stock details");
      return api.stocks.get.responses[200].parse(await res.json());
    },
    enabled: !!ticker,
  });
}

export function useCreateStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertStock) => {
      const res = await fetch(api.stocks.create.path, {
        method: api.stocks.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create stock");
      return api.stocks.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.stocks.list.path] });
    },
  });
}

export function useAddFundamental() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: InsertFundamental) => {
      // Validate with schema first
      const validated = api.stocks.addFundamental.input.parse(data);
      
      const res = await fetch(api.stocks.addFundamental.path, {
        method: api.stocks.addFundamental.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });
      if (!res.ok) throw new Error("Failed to add fundamental data");
      return api.stocks.addFundamental.responses[201].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [api.stocks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.stocks.get.path, variables.ticker] });
    },
  });
}
