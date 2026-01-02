# Replit Scraper - Brazilian Stocks Dashboard

## Overview

This project is a web application that scrapes financial data for Brazilian stocks from [fundamentus.com.br/resultado.php](https://www.fundamentus.com.br/resultado.php) and populates an interactive dashboard with key metrics and information. Originally generated and developed using Replit's browser-based UI until hitting free tier limits, it's now configured for local development.

The dashboard includes features like stock filtering, detailed views, and the Magic Formula for stock screening.

## Features

- Scraping and storage of Brazilian stock data (e.g., ROE, P/L, liquidity)
- Interactive dashboard with metric cards and stock tables
- Sidebar filters for sorting and searching stocks
- Stock detail pages with charts
- Magic Formula implementation for value investing
- Responsive design with dark mode

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui components, Recharts
- **Backend**: Node.js, Express.js, TypeScript
- **Database**: PostgreSQL with Drizzle ORM and Zod validation
- **State Management**: TanStack Query
- **Other**: Passport.js for authentication, WebSockets for real-time updates

## How It Works

1. **Data Scraping**: The backend (server/index.ts) uses HTTP requests to fetch data from fundamentus.com.br/resultado.php, parses the HTML (likely with Cheerio or similar), and extracts stock metrics.
2. **Data Storage**: Parsed data is inserted into a PostgreSQL database using Drizzle ORM (see shared/schema.ts).
3. **API Layer**: Express server (server/routes.ts) provides REST endpoints for querying stock data, shared with frontend via shared/routes.ts.
4. **Frontend Rendering**: React app (client/src) consumes APIs with TanStack Query, renders components like StockTable, MetricCard, and pages (Home.tsx, StockDetail.tsx, MagicFormula.tsx).
5. **Build & Dev**: Frontend built with Vite; backend with tsx for dev and esbuild for production.

Scraping can be triggered manually or via a scheduled job (implement in server if needed).

## Installation

1. Clone the repo:
   ```
   git clone <your-repo-url>
   cd replit-scraper
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment:
   - Create `.env` with `DATABASE_URL=postgres://user:pass@host:port/db` (see server/db.ts).
   - Add any API keys if needed.
   - Local DB: `podman run -d --name postgres-db -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=replit_scraper -p 5432:5432 docker.io/library/postgres:16`

4. Initialize database:
   ```
   npm run db:push
   ```

5. Run development server:
   ```
   npm run dev
   ```
   - Backend: http://localhost:3000
   - Frontend: http://localhost:5173

6. Build for production:
   ```
   npm run build
   npm start
   ```

## Usage

- Navigate to http://localhost:5173
- Use SidebarFilters to select and filter stocks
- View aggregated metrics on Home page
- Analyze individual stocks on StockDetail
- Screen stocks with Magic Formula on dedicated page

To update data, implement or run a scraping endpoint (e.g., POST /scrape).

## Screenshots

### Dashboard Home

![Home Dashboard Screenshot]()

### Stock Table and Filters

![Stock Table Screenshot]()

### Stock Detail View

![Stock Detail Screenshot]()

### Magic Formula Results

![Magic Formula Screenshot]()

(Placeholders for UI screenshots - add images later)

## Next Steps

- Automate scraping with cron jobs
- Add user authentication
- Deploy to Vercel/Heroku
- Enhance charts and export features

## License

MIT
