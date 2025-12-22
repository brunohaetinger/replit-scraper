import { Header } from "@/components/Header";
import { StockTable } from "@/components/StockTable";
import { useStocks } from "@/hooks/use-stocks";
import { Sparkles, Trophy } from "lucide-react";

export default function MagicFormula() {
  // Magic Formula relies on High ROIC and Low EV/EBIT (which means High EBIT/EV)
  // We'll request sorting by magic_formula from backend
  const { data: stocks, isLoading } = useStocks({
    sortBy: 'magic_formula',
    minRoe: 0, // Reset these defaults to show full ranking
    minDivYield: 0,
    maxPl: 100,
    maxPvp: 100,
  });

  return (
    <div className="min-h-screen bg-background font-body">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 md:p-12 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden">
            {/* Background pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 backdrop-blur rounded-lg">
                  <Sparkles className="w-6 h-6 text-yellow-300" />
                </div>
                <span className="text-indigo-100 font-medium tracking-wide text-sm uppercase">Strategy View</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
                The Magic Formula
              </h1>
              <p className="text-indigo-100 max-w-xl text-lg leading-relaxed">
                Ranking companies based on Joel Greenblatt's methodology: 
                buying <span className="text-white font-semibold">good companies</span> (high ROIC) 
                at <span className="text-white font-semibold">bargain prices</span> (high Earnings Yield).
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
               <h3 className="text-muted-foreground text-sm font-medium uppercase mb-2">Top Ranked</h3>
               <div className="flex items-center gap-3">
                 <Trophy className="w-8 h-8 text-yellow-500" />
                 <div>
                   <span className="text-2xl font-bold font-mono">
                     {stocks?.[0]?.ticker || "---"}
                   </span>
                   <p className="text-xs text-muted-foreground">{stocks?.[0]?.name}</p>
                 </div>
               </div>
             </div>
             
             <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
               <h3 className="text-muted-foreground text-sm font-medium uppercase mb-2">Highest ROIC</h3>
               <span className="text-2xl font-bold font-mono text-emerald-600">
                 {Math.max(...(stocks?.map(s => s.latest?.roic || 0) || [0])).toFixed(1)}%
               </span>
               <p className="text-xs text-muted-foreground mt-1">Return on Invested Capital</p>
             </div>
             
             <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
               <h3 className="text-muted-foreground text-sm font-medium uppercase mb-2">Best Earnings Yield</h3>
               <span className="text-2xl font-bold font-mono text-primary">
                 {Math.max(...(stocks?.map(s => s.latest?.ebitEv || 0) || [0])).toFixed(2)}
               </span>
               <p className="text-xs text-muted-foreground mt-1">EBIT / EV</p>
             </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-display font-semibold px-2">Ranked Opportunities</h2>
            <StockTable stocks={stocks || []} isLoading={isLoading} />
          </div>
          
        </div>
      </main>
    </div>
  );
}
