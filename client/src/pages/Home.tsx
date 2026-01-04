import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SidebarFilters } from "@/components/SidebarFilters";
import { StockTable } from "@/components/StockTable";
import { MyStockListCard } from "@/components/MyStockListCard";
import { useStocks, useScrapeData } from "@/hooks/use-stocks";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Home() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    maxPl: 15,
    minRoe: 10,
    maxPvp: 2.5,
    minDivYield: 6,
    excludeStateOwned: false,
  });
  const [myStocks, setMyStocks] = useState<string[]>([]);
  const [myStockFilter, setMyStockFilter] = useState({ filterMyList: false, highlightMyList: false });

  const { data: allStocks, isLoading, refetch, isRefetching } = useStocks({
    search,
    ...filters,
    sortBy: 'magic_formula',
  });

  // Filter stocks based on myStocks list
  const stocks = useMemo(() => {
    if (!allStocks) return [];
    if (myStockFilter.filterMyList && myStocks.length > 0) {
      return allStocks.filter(stock => myStocks.includes(stock.ticker));
    }
    return allStocks;
  }, [allStocks, myStockFilter.filterMyList, myStocks]);

  const scrapeMutation = useScrapeData();

  const handleReset = () => {
    setFilters({
      maxPl: 15,
      minRoe: 10,
      maxPvp: 2.5,
      minDivYield: 6,
      excludeStateOwned: false,
    });
    setSearch("");
  };

  const handleScrape = async () => {
    try {
      const result = await scrapeMutation.mutateAsync();
      toast({
        title: "Data Scraped Successfully",
        description: `Scraped ${result.scraped} stocks. Created: ${result.stocksCreated}, Updated: ${result.stocksUpdated}`,
      });
    } catch (error: any) {
      toast({
        title: "Scraping Failed",
        description: error.message || "Failed to scrape data from fundamentus.com.br",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <Header onSearch={setSearch} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Filters Sidebar - Hidden on mobile, handled differently in real app but stacked here for now */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-6">
              <SidebarFilters 
                values={filters} 
                onChange={setFilters} 
                onReset={handleReset} 
              />
              <MyStockListCard
                onFilterChange={setMyStockFilter}
                myStocks={myStocks}
                onMyStocksChange={setMyStocks}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-display font-bold text-foreground">Stock Screener</h1>
                <p className="text-muted-foreground mt-1">
                  Find undervalued companies based on fundamental analysis.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={handleScrape}
                  disabled={scrapeMutation.isPending}
                  className="rounded-xl"
                >
                  <Download className={`w-4 h-4 mr-2 ${scrapeMutation.isPending ? 'animate-pulse' : ''}`} />
                  Scrape Data
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => refetch()}
                  className="h-10 w-10 rounded-xl"
                  disabled={isRefetching}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Mobile Filters would go here (Collapsible) */}
            
            <StockTable 
              stocks={stocks || []} 
              isLoading={isLoading}
              highlightStocks={myStockFilter.highlightMyList ? myStocks : []}
            />
            
            <div className="text-center text-sm text-muted-foreground pt-8">
              Showing {stocks?.length || 0} results based on your criteria.
              {myStockFilter.filterMyList && myStocks.length > 0 && (
                <span className="ml-2 text-primary">(Filtered to my list)</span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
