import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { FilterX } from "lucide-react";

interface FilterValues {
  maxPl: number;
  minRoe: number;
  maxPvp: number;
  minDivYield: number;
  excludeStateOwned: boolean;
}

interface SidebarFiltersProps {
  values: FilterValues;
  onChange: (newValues: FilterValues) => void;
  onReset: () => void;
}

export function SidebarFilters({ values, onChange, onReset }: SidebarFiltersProps) {
  const handleChange = (key: keyof FilterValues, value: number | boolean) => {
    onChange({ ...values, [key]: value });
  };

  return (
    <div className="space-y-6 lg:w-72 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onReset}
          className="h-8 px-2 text-muted-foreground hover:text-foreground"
        >
          <FilterX className="w-3.5 h-3.5 mr-1.5" />
          Reset
        </Button>
      </div>

      <div className="space-y-6">
        {/* P/L Filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Max P/L</Label>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              {values.maxPl}
            </span>
          </div>
          <Slider
            value={[values.maxPl]}
            min={0}
            max={50}
            step={1}
            onValueChange={([val]) => handleChange("maxPl", val)}
            className="py-2"
          />
        </div>

        {/* ROE Filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Min ROE %</Label>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              {values.minRoe}%
            </span>
          </div>
          <Slider
            value={[values.minRoe]}
            min={0}
            max={40}
            step={1}
            onValueChange={([val]) => handleChange("minRoe", val)}
            className="py-2"
          />
        </div>

        {/* P/VP Filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Max P/VP</Label>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              {values.maxPvp}
            </span>
          </div>
          <Slider
            value={[values.maxPvp]}
            min={0}
            max={10}
            step={0.1}
            onValueChange={([val]) => handleChange("maxPvp", val)}
            className="py-2"
          />
        </div>

        {/* Dividend Yield Filter */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-sm font-medium">Min Div Yield %</Label>
            <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded text-muted-foreground">
              {values.minDivYield}%
            </span>
          </div>
          <Slider
            value={[values.minDivYield]}
            min={0}
            max={20}
            step={0.5}
            onValueChange={([val]) => handleChange("minDivYield", val)}
            className="py-2"
          />
        </div>

        {/* State Owned Toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="space-y-0.5">
            <Label className="text-sm font-medium">Private Only</Label>
            <p className="text-[10px] text-muted-foreground">Exclude state-owned</p>
          </div>
          <Switch
            checked={values.excludeStateOwned}
            onCheckedChange={(val) => handleChange("excludeStateOwned", val)}
          />
        </div>
      </div>
    </div>
  );
}
