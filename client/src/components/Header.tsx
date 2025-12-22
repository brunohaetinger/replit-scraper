import { Link, useLocation } from "wouter";
import { TrendingUp, BarChart3, Search } from "lucide-react";
import { clsx } from "clsx";
import { Input } from "@/components/ui/input";

export function Header({ onSearch }: { onSearch?: (val: string) => void }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Screener", icon: BarChart3 },
    { href: "/magic-formula", label: "Magic Formula", icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mr-8 group">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:scale-105 transition-transform duration-200">
            <TrendingUp className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:block">
            Fundamentus<span className="text-primary">.ai</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 mr-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={clsx(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Search */}
        {onSearch && (
          <div className="relative w-full max-w-xs md:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search ticker (e.g. PETR4)..." 
              className="pl-9 h-10 bg-muted/30 border-transparent focus:bg-background focus:border-primary transition-all rounded-xl"
              onChange={(e) => onSearch(e.target.value)}
            />
          </div>
        )}
      </div>
    </header>
  );
}
