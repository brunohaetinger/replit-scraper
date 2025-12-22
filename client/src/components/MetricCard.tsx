import { clsx } from "clsx";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  highlight?: boolean;
  subtext?: string;
  className?: string;
}

export function MetricCard({ 
  label, 
  value, 
  suffix = "", 
  trend, 
  highlight = false, 
  subtext,
  className 
}: MetricCardProps) {
  return (
    <div className={clsx(
      "p-4 rounded-xl border transition-all duration-200",
      highlight 
        ? "bg-primary/5 border-primary/20 shadow-lg shadow-primary/5" 
        : "bg-card border-border shadow-sm",
      className
    )}>
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </span>
        {trend && (
          <div className={clsx(
            "p-1 rounded-full",
            trend === "up" && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30",
            trend === "down" && "bg-red-100 text-red-600 dark:bg-red-900/30",
            trend === "neutral" && "bg-gray-100 text-gray-600 dark:bg-gray-800"
          )}>
            {trend === "up" && <ArrowUpRight className="w-3 h-3" />}
            {trend === "down" && <ArrowDownRight className="w-3 h-3" />}
            {trend === "neutral" && <Minus className="w-3 h-3" />}
          </div>
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={clsx(
          "text-2xl font-bold font-mono tracking-tight",
          highlight ? "text-primary" : "text-foreground"
        )}>
          {value}
        </span>
        {suffix && (
          <span className="text-sm font-medium text-muted-foreground">{suffix}</span>
        )}
      </div>
      
      {subtext && (
        <p className="mt-2 text-xs text-muted-foreground border-t border-border/50 pt-2">
          {subtext}
        </p>
      )}
    </div>
  );
}
