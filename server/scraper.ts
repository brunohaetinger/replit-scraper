import * as cheerio from 'cheerio';
import { log } from './index';

export interface ScrapedStock {
  ticker: string;
  name: string;
  sector: string;
  pl: number | null;
  pvp: number | null;
  roe: number | null;
  roic: number | null;
  divYield: number | null;
  ebitEv: number | null;
  netProfit: number | null;
  liquidity: number | null;
}

/**
 * Converts Brazilian number format to float
 * e.g., "1.234,56" -> 1234.56, "15,3%" -> 15.3
 */
function parseNumber(value: string | undefined): number | null {
  if (!value || value === '-' || value === 'n/a') return null;
  
  try {
    // Remove percentage sign
    let cleaned = value.replace('%', '').trim();
    
    // Convert Brazilian format (1.234,56) to US format (1234.56)
    cleaned = cleaned.replace(/\./g, ''); // Remove thousand separators
    cleaned = cleaned.replace(',', '.'); // Convert decimal separator
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  } catch (e) {
    return null;
  }
}

/**
 * Scrapes stock data from fundamentus.com.br/resultado.php
 */
export async function scrapeFundamentus(): Promise<ScrapedStock[]> {
  const url = 'https://www.fundamentus.com.br/resultado.php';
  
  log('Starting scrape from ' + url, 'scraper');
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const stocks: ScrapedStock[] = [];
    
    // Find the main results table
    // The table structure has headers in first row, data in subsequent rows
    const table = $('#resultado');
    
    if (table.length === 0) {
      log('Could not find results table', 'scraper');
      return stocks;
    }
    
    // Get column headers for debugging
    const headers: string[] = [];
    table.find('thead tr th').each((_, el) => {
      const text = $(el).text().trim();
      headers.push(text);
    });
    
    log(`Found ${headers.length} columns`, 'scraper');
    
    // Parse each row in tbody
    // Column positions based on fundamentus.com.br structure:
    // 0: Papel (Ticker)
    // 1: Cotação (Price) - not stored
    // 2: P/L
    // 3: P/VP
    // 4: PSR
    // 5: Div.Yield
    // 6: P/Ativo
    // 7: P/Cap.Giro
    // 8: P/EBIT
    // 9: P/Ativ Circ.Liq
    // 10: EV/EBIT
    // 11: EV/EBITDA
    // 12: Mrg Ebit
    // 13: Mrg. Líq.
    // 14: Liq. Corr.
    // 15: ROIC
    // 16: ROE
    // 17: Liq.2meses
    // 18: Patrim. Líq
    // 19: Dív.Brut/ Patrim.
    // 20: Cresc. Rec.5a
    
    table.find('tbody tr').each((_, row) => {
      const cells = $(row).find('td');
      
      if (cells.length === 0) return;
      
      try {
        const ticker = $(cells[0]).text().trim();
        
        // Skip if no ticker
        if (!ticker) return;
        
        // Get company name from the ticker link
        const tickerLink = $(cells[0]).find('a');
        let name = ticker;
        let sector = 'Unknown';
        
        // Try to get more info from the detalhes page link
        if (tickerLink.length > 0) {
          name = tickerLink.attr('title') || ticker;
        }
        
        const stock: ScrapedStock = {
          ticker,
          name,
          sector, // Sector info not available in resultado.php table
          pl: parseNumber($(cells[2]).text()),
          pvp: parseNumber($(cells[3]).text()),
          roe: parseNumber($(cells[16]).text()),
          roic: parseNumber($(cells[15]).text()),
          divYield: parseNumber($(cells[5]).text()),
          ebitEv: parseNumber($(cells[10]).text()),
          netProfit: parseNumber($(cells[13]).text()), // Using Mrg. Líq. as proxy
          liquidity: parseNumber($(cells[17]).text()),
        };
        
        stocks.push(stock);
      } catch (e) {
        log(`Error parsing row: ${e}`, 'scraper');
      }
    });
    
    log(`Successfully scraped ${stocks.length} stocks`, 'scraper');
    return stocks;
    
  } catch (error) {
    log(`Scraping error: ${error}`, 'scraper');
    throw error;
  }
}

/**
 * Detects if a company is likely state-owned based on name or ticker
 */
export function isLikelyStateOwned(name: string, ticker: string): boolean {
  const stateKeywords = [
    'banco do brasil',
    'petrobras',
    'eletrobras',
    'caixa',
    'correios',
    'sabesp',
    'copel',
    'cemig',
    'telebras'
  ];
  
  const stateTickers = [
    'BBAS3', // Banco do Brasil
    'PETR3', 'PETR4', // Petrobras
    'ELET3', 'ELET6', // Eletrobras
    'CXSE3', // Caixa Seguridade
    'SBSP3', // Sabesp
    'CPLE6', // Copel
    'CMIG4', // Cemig
  ];
  
  const lowerName = name.toLowerCase();
  const lowerTicker = ticker.toUpperCase();
  
  return stateKeywords.some(keyword => lowerName.includes(keyword)) ||
         stateTickers.includes(lowerTicker);
}
