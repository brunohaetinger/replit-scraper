import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Star } from "lucide-react";

interface MyStockListCardProps {
  onFilterChange: (filter: { filterMyList: boolean; highlightMyList: boolean }) => void;
  myStocks: string[];
  onMyStocksChange: (stocks: string[]) => void;
}

const STORAGE_KEY = "my-stock-list";

export function MyStockListCard({ onFilterChange, myStocks, onMyStocksChange }: MyStockListCardProps) {
  const [newTicker, setNewTicker] = useState("");
  const [filterMyList, setFilterMyList] = useState(false);
  const [highlightMyList, setHighlightMyList] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        onMyStocksChange(parsed);
      } catch (e) {
        console.error("Failed to parse stored stocks", e);
      }
    }
  }, []);

  // Save to localStorage whenever myStocks changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(myStocks));
  }, [myStocks]);

  // Notify parent when filter changes
  useEffect(() => {
    onFilterChange({ filterMyList, highlightMyList });
  }, [filterMyList, highlightMyList, onFilterChange]);

  const handleAddTicker = () => {
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !myStocks.includes(ticker)) {
      onMyStocksChange([...myStocks, ticker]);
      setNewTicker("");
    }
  };

  const handleRemoveTicker = (ticker: string) => {
    onMyStocksChange(myStocks.filter(t => t !== ticker));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddTicker();
    }
  };

  const handleFilterToggle = (checked: boolean) => {
    setFilterMyList(checked);
    // When filtering is enabled, disable highlighting
    if (checked) {
      setHighlightMyList(false);
    }
  };

  const handleHighlightToggle = (checked: boolean) => {
    setHighlightMyList(checked);
    // When highlighting is enabled, disable filtering
    if (checked) {
      setFilterMyList(false);
    }
  };

  return (
    <Card className="p-6 space-y-4 bg-card border-border">
      <div className="flex items-center gap-2 mb-2">
        <Star className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-lg">My Stock List</h3>
      </div>

      {/* Input to add stocks */}
      <div className="space-y-2">
        <Label htmlFor="add-ticker" className="text-sm font-medium">Add Ticker</Label>
        <div className="flex gap-2">
          <Input
            id="add-ticker"
            placeholder="e.g., PETR4"
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button 
            onClick={handleAddTicker} 
            size="icon"
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* List of added stocks */}
      {myStocks.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">My Tickers ({myStocks.length})</Label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-muted/20 rounded-md">
            {myStocks.map((ticker) => (
              <Badge 
                key={ticker} 
                variant="secondary"
                className="flex items-center gap-1 px-2 py-1 font-mono"
              >
                {ticker}
                <button
                  onClick={() => handleRemoveTicker(ticker)}
                  className="ml-1 hover:text-destructive transition-colors"
                  aria-label={`Remove ${ticker}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Toggle buttons */}
      <div className="space-y-3 pt-2 border-t border-border/50">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Filter My List</Label>
            <p className="text-[10px] text-muted-foreground">Show only my stocks</p>
          </div>
          <Switch
            checked={filterMyList}
            onCheckedChange={handleFilterToggle}
            disabled={myStocks.length === 0}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Highlight on List</Label>
            <p className="text-[10px] text-muted-foreground">Highlight my stocks</p>
          </div>
          <Switch
            checked={highlightMyList}
            onCheckedChange={handleHighlightToggle}
            disabled={myStocks.length === 0}
          />
        </div>
      </div>
    </Card>
  );
}
