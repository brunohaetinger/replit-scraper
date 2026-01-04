import { useState, useMemo } from "react";
import { Link } from "wouter";
import { ArrowRight, Building2, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { clsx } from "clsx";
import type { StockWithLatestFundamental } from "@shared/schema";

interface StockTableProps {
  stocks: StockWithLatestFundamental[];
  isLoading: boolean;
  highlightStocks?: string[];
}

type SortKey = 'ticker' | 'pl' | 'roe' | 'pvp' | 'divYield' | 'ebitEv' | 'roic' | 'magicRank';
type SortDirection = 'asc' | 'desc' | null;

export function StockTable({ stocks, isLoading, highlightStocks = [] }: StockTableProps) {
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const sortedStocks = useMemo(() => {
    if (!sortKey || !sortDirection) return stocks;

    return [...stocks].sort((a, b) => {
      let aValue: number | string | null;
      let bValue: number | string | null;

      if (sortKey === 'ticker') {
        aValue = a.ticker;
        bValue = b.ticker;
      } else if (sortKey === 'magicRank') {
        aValue = (a as any).magicRank ?? null;
        bValue = (b as any).magicRank ?? null;
      } else {
        aValue = (a.latest as any)?.[sortKey] ?? null;
        bValue = (b.latest as any)?.[sortKey] ?? null;
      }

      // Handle null values - push them to the end
      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      // Compare values
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  }, [stocks, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
    if (sortKey !== columnKey) {
      return <ArrowUpDown className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-50 transition-opacity" />;
    }
    if (sortDirection === 'asc') {
      return <ArrowUp className="w-3 h-3 ml-1 text-primary" />;
    }
    return <ArrowDown className="w-3 h-3 ml-1 text-primary" />;
  };

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 w-full bg-muted/30 animate-pulse rounded-xl border border-border/50" />
        ))}
      </div>
    );
  }

  if (stocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border border-dashed border-border text-center">
        <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-display font-medium text-foreground">No stocks found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-hidden bg-card border border-border rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/30 border-b border-border text-muted-foreground font-medium uppercase tracking-wider text-xs">
            <tr>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('magicRank')}
              >
                <div className="flex items-center">
                  MF Rank
                  <SortIcon columnKey="magicRank" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('ticker')}
              >
                <div className="flex items-center">
                  Ticker
                  <SortIcon columnKey="ticker" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('pl')}
              >
                <div className="flex items-center">
                  P/L
                  <SortIcon columnKey="pl" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('roe')}
              >
                <div className="flex items-center">
                  ROE
                  <SortIcon columnKey="roe" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('pvp')}
              >
                <div className="flex items-center">
                  P/VP
                  <SortIcon columnKey="pvp" />
                </div>
              </th>
              <th 
                className="px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('divYield')}
              >
                <div className="flex items-center">
                  Div Yield
                  <SortIcon columnKey="divYield" />
                </div>
              </th>
              <th 
                className="px-6 py-4 hidden md:table-cell cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('ebitEv')}
              >
                <div className="flex items-center">
                  EBIT/EV
                  <SortIcon columnKey="ebitEv" />
                </div>
              </th>
              <th 
                className="px-6 py-4 hidden md:table-cell cursor-pointer hover:bg-muted/50 transition-colors group"
                onClick={() => handleSort('roic')}
              >
                <div className="flex items-center">
                  ROIC
                  <SortIcon columnKey="roic" />
                </div>
              </th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {sortedStocks.map((stock) => {
              const fundamentals = stock.latest;
              const hasMagicFormula = fundamentals?.ebitEv != null && fundamentals?.roic != null;
              const isHighlighted = highlightStocks.includes(stock.ticker);
              const magicRank = (stock as any).magicRank;

              return (
                <tr 
                  key={stock.ticker}
                  className={clsx(
                    "group hover:bg-muted/20 transition-colors duration-150",
                    isHighlighted && "bg-primary/10 border-l-4 border-l-primary"
                  )}
                >
                  <td className="px-6 py-4 font-mono text-sm">
                    {magicRank ? (
                      <span className={clsx(
                        "inline-flex items-center justify-center w-10 h-10 rounded-lg font-bold",
                        magicRank <= 10 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" :
                        magicRank <= 30 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                        "bg-muted/50 text-muted-foreground"
                      )}>
                        {magicRank}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground font-mono">{stock.ticker}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                        {stock.name}
                      </span>
                      {stock.isStateOwned && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 w-fit mt-1">
                          SOE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {fundamentals?.pl ? fundamentals.pl.toFixed(1) : '-'}
                  </td>
                  <td className={clsx("px-6 py-4 font-mono font-medium", 
                    (fundamentals?.roe || 0) > 15 ? "text-emerald-600 dark:text-emerald-400" : ""
                  )}>
                    {fundamentals?.roe ? `${fundamentals.roe}%` : '-'}
                  </td>
                  <td className="px-6 py-4 font-mono">
                    {fundamentals?.pvp ? fundamentals.pvp.toFixed(2) : '-'}
                  </td>
                  <td className={clsx("px-6 py-4 font-mono",
                    (fundamentals?.divYield || 0) > 6 ? "text-emerald-600 dark:text-emerald-400" : ""
                  )}>
                    {fundamentals?.divYield ? `${fundamentals.divYield}%` : '-'}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell font-mono text-muted-foreground">
                    {fundamentals?.ebitEv ? fundamentals.ebitEv.toFixed(2) : '-'}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell font-mono text-muted-foreground">
                    {fundamentals?.roic ? `${fundamentals.roic.toFixed(1)}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      href={`/stocks/${stock.ticker}`} 
                      className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-primary/10 hover:text-primary-dark transition-all"
                    >
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
