import { Link } from "wouter";
import { ArrowRight, Building2, TrendingUp } from "lucide-react";
import { clsx } from "clsx";
import type { StockWithLatestFundamental } from "@shared/schema";

interface StockTableProps {
  stocks: StockWithLatestFundamental[];
  isLoading: boolean;
}

export function StockTable({ stocks, isLoading }: StockTableProps) {
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
              <th className="px-6 py-4">Ticker</th>
              <th className="px-6 py-4">P/L</th>
              <th className="px-6 py-4">ROE</th>
              <th className="px-6 py-4">P/VP</th>
              <th className="px-6 py-4">Div Yield</th>
              <th className="px-6 py-4 hidden md:table-cell">EBIT/EV</th>
              <th className="px-6 py-4 hidden md:table-cell">ROIC</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {stocks.map((stock) => {
              const fundamentals = stock.latest;
              const hasMagicFormula = fundamentals?.ebitEv != null && fundamentals?.roic != null;

              return (
                <tr 
                  key={stock.ticker}
                  className="group hover:bg-muted/20 transition-colors duration-150"
                >
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
