import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center max-w-md text-center px-4">
        <div className="bg-destructive/10 p-4 rounded-full mb-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        
        <h1 className="text-4xl font-display font-bold mb-3 tracking-tight">404 Page Not Found</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          We couldn't find the financial data you were looking for. The ticker might be delisted or incorrect.
        </p>

        <Link href="/">
          <a className="inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 py-2 w-full sm:w-auto shadow-lg shadow-primary/20">
            Return to Screener
          </a>
        </Link>
      </div>
    </div>
  );
}
