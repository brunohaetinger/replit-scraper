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
- **Web Scraping**: Cheerio for HTML parsing
- **Other**: Passport.js for authentication, WebSockets for real-time updates

## How It Works

1. **Data Scraping**: The backend (server/scraper.ts) uses HTTP requests with Cheerio to fetch and parse HTML from fundamentus.com.br/resultado.php, extracting stock metrics including:
   - Ticker symbol and company name
   - Sector classification
   - Fundamental ratios (P/L, P/VP, ROE, ROIC)
   - Dividend Yield
   - EBIT/EV and liquidity metrics
   - Net profit data

2. **Data Storage**: Parsed data is upserted into a PostgreSQL database using Drizzle ORM (see shared/schema.ts). The system intelligently updates existing records or creates new ones.

3. **API Layer**: Express server (server/routes.ts) provides REST endpoints:
   - `GET /api/stocks` - Query stocks with filters
   - `GET /api/stocks/:ticker` - Get individual stock details with history
   - `POST /api/scrape` - Trigger data scraping from fundamentus.com.br

4. **Frontend Rendering**: React app (client/src) consumes APIs with TanStack Query, renders components like StockTable, MetricCard, and pages (Home.tsx, StockDetail.tsx, MagicFormula.tsx).

5. **Build & Dev**: Frontend built with Vite; backend with tsx for dev and esbuild for production.

### Scraping Data

You can scrape real-time data from fundamentus.com.br in two ways:

1. **Via UI**: Click the "Scrape Data" button in the top-right of the dashboard
2. **Via API**: Send a POST request to `/api/scrape`

The scraper will:
- Fetch the latest data table from fundamentus.com.br/resultado.php
- Parse all stock entries with their fundamental metrics
- Update the database with the latest values
- Return statistics about the scraping operation

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
- Click "Scrape Data" button to fetch the latest data from fundamentus.com.br
- Use SidebarFilters to select and filter stocks
- View aggregated metrics on Home page
- Analyze individual stocks on StockDetail
- Screen stocks with Magic Formula on dedicated page

### Manual Scraping via API

```bash
curl -X POST http://localhost:5000/api/scrape
```

Response example:
```json
{
  "message": "Scraping completed successfully",
  "scraped": 450,
  "stocksCreated": 50,
  "stocksUpdated": 400,
  "fundamentalsCreated": 450
}
```

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
