import { useRoute } from "wouter";
import { useStock, useScrapeStockDetail } from "@/hooks/use-stocks";
import { Header } from "@/components/Header";
import { MetricCard } from "@/components/MetricCard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp, Info, Download, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function StockDetail() {
  const [match, params] = useRoute("/stocks/:ticker");
  const ticker = params?.ticker;
  const { data: stock, isLoading } = useStock(ticker || "");
  const { toast } = useToast();
  const scrapeDetailMutation = useScrapeStockDetail();

  const handleScrapeDetails = async () => {
    if (!ticker) return;
    
    try {
      const result = await scrapeDetailMutation.mutateAsync(ticker);
      toast({
        title: "Details Updated",
        description: `Successfully updated details for ${result.stock.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to Update",
        description: error.message || "Could not fetch stock details",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <StockDetailSkeleton />;
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold text-foreground mb-2">Stock Not Found</h1>
        <p className="text-muted-foreground mb-4">Could not find data for {ticker}</p>
        <Link href="/" className="text-primary hover:underline">Go Home</Link>
      </div>
    );
  }

  const fundamental = stock.latest || {};
  const hasLimitedInfo = stock.name === stock.ticker || stock.sector === 'Unknown';
  
  // Transform real historical data for charts
  const history = stock.history || [];
  
  const profitHistory = history.map((h: any) => ({
    date: format(new Date(h.date), "MMM yy"),
    value: h.netProfit
  }));
  
  const roeHistory = history.map((h: any) => ({
    date: format(new Date(h.date), "MMM yy"),
    roe: h.roe,
    divYield: h.divYield
  }));

  return (
    <div className="min-h-screen bg-background font-body pb-20">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Screener
        </Link>

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-mono font-bold text-foreground tracking-tight">
                {stock.ticker}
              </h1>
              {stock.isStateOwned && (
                <span className="px-2 py-1 bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 text-xs font-semibold rounded-md">
                  State Owned
                </span>
              )}
            </div>
            <h2 className="text-xl text-muted-foreground font-medium">{stock.name}</h2>
            <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
              <span className="bg-muted px-2 py-1 rounded-md">{stock.sector || "Unknown Sector"}</span>
              {stock.subsector && (
                <>
                  <span>•</span>
                  <span className="bg-muted px-2 py-1 rounded-md">{stock.subsector}</span>
                </>
              )}
              <span>•</span>
              <span>Updated {format(new Date(), "MMM d, yyyy")}</span>
            </div>
            
            <div className="mt-4 flex gap-2">
              {hasLimitedInfo && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleScrapeDetails}
                  disabled={scrapeDetailMutation.isPending}
                  className="text-xs"
                >
                  <Download className={`w-3 h-3 mr-2 ${scrapeDetailMutation.isPending ? 'animate-pulse' : ''}`} />
                  Fetch Complete Details
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs"
              >
                <a 
                  href={`https://statusinvest.com.br/acoes/${stock.ticker.toLowerCase()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-3 h-3 mr-2" />
                  View on Status Invest
                </a>
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <MetricCard 
              label="Current P/L" 
              value={fundamental.pl?.toFixed(1) || "-"} 
              className="min-w-[140px]"
            />
             <MetricCard 
              label="Dividend Yield" 
              value={fundamental.divYield?.toFixed(1) || "-"} 
              suffix="%"
              highlight
              className="min-w-[140px]"
            />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <MetricCard label="P/VP" value={fundamental.pvp?.toFixed(2) || "-"} />
          <MetricCard label="ROE" value={fundamental.roe?.toFixed(1) || "-"} suffix="%" />
          <MetricCard label="EBIT/EV" value={fundamental.ebitEv?.toFixed(2) || "-"} />
          <MetricCard label="ROIC" value={fundamental.roic?.toFixed(1) || "-"} suffix="%" />
        </div>

        {/* Analysis Charts */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Stability Analysis */}
          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-display">Profit Stability</h3>
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={profitHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--background)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--primary)" 
                    strokeWidth={2} 
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-muted/30 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                <span className="font-semibold text-foreground">Tip:</span> Consistent profit growth over multiple periods indicates a stable business model, distinct from one-off events.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold font-display">ROE & Yield Trends</h3>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={roeHistory}>
                   <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="var(--muted-foreground)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                     contentStyle={{ 
                      backgroundColor: 'var(--background)', 
                      borderColor: 'var(--border)', 
                      borderRadius: '8px' 
                    }} 
                  />
                  <Line 
                    name="ROE"
                    type="monotone" 
                    dataKey="roe" 
                    stroke="var(--accent)" 
                    strokeWidth={2} 
                    dot={false}
                  />
                  <Line 
                    name="Div Yield"
                    type="monotone" 
                    dataKey="divYield" 
                    stroke="var(--primary)" 
                    strokeWidth={2} 
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-emerald-500 rounded-full" />
                <span className="text-muted-foreground">ROE Trend</span>
              </div>
               <div className="flex items-center gap-2">
                <div className="w-3 h-1 bg-blue-500 rounded-full opacity-50" style={{backgroundImage: 'linear-gradient(90deg, var(--primary) 0%, var(--primary) 50%, transparent 50%)'}} />
                <span className="text-muted-foreground">Div. Yield Trend</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StockDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background font-body p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <Skeleton className="h-8 w-32" />
        <div className="space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-8">
           <Skeleton className="h-80 w-full rounded-2xl" />
           <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
