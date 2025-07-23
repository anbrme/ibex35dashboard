import axios from 'axios';
import * as cheerio from 'cheerio';
import type { Company, CompanyDetails } from '../types';
import { DatabaseService } from './databaseService';

export class YahooFinanceService {
  private static readonly BASE_URL = 'https://finance.yahoo.com';
  private static readonly IBEX_URL = `${YahooFinanceService.BASE_URL}/quote/%5EIBEX/components`;

  static async fetchIbex35Companies(): Promise<Company[]> {
    try {
      const response = await axios.get(YahooFinanceService.IBEX_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const companies: Company[] = [];

      $('table tbody tr').each((_, element) => {
        const $row = $(element);
        const cells = $row.find('td');
        
        if (cells.length >= 6) {
          const symbolElement = cells.eq(0).find('a');
          const symbol = symbolElement.text().trim();
          const name = cells.eq(1).text().trim();
          const priceText = cells.eq(2).text().trim();
          const changeText = cells.eq(3).text().trim();
          const changePercentText = cells.eq(4).text().trim();
          const volumeText = cells.eq(5).text().trim();

          if (symbol && name) {
            const company: Company = {
              symbol: symbol,
              name: name,
              price: YahooFinanceService.parseNumber(priceText),
              change: YahooFinanceService.parseNumber(changeText),
              changePercent: YahooFinanceService.parsePercentage(changePercentText),
              volume: YahooFinanceService.parseVolume(volumeText)
            };
            companies.push(company);
          }
        }
      });

      for (const company of companies) {
        await DatabaseService.saveCompany(company);
      }

      if (companies.length === 0) {
        const fallbackCompanies = YahooFinanceService.getFallbackCompanies();
        for (const company of fallbackCompanies) {
          await DatabaseService.saveCompany(company);
        }
        return fallbackCompanies;
      }

      return companies;
    } catch (error) {
      console.error('Error fetching IBEX 35 companies:', error);
      const fallbackCompanies = YahooFinanceService.getFallbackCompanies();
      for (const company of fallbackCompanies) {
        await DatabaseService.saveCompany(company);
      }
      return fallbackCompanies;
    }
  }

  static async fetchCompanyDetails(symbol: string): Promise<CompanyDetails | null> {
    try {
      const profileUrl = `${YahooFinanceService.BASE_URL}/quote/${symbol}/profile`;
      const response = await axios.get(profileUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      const description = $('[data-testid="description"]').text().trim();
      const sector = $('[data-testid="sector"]').text().trim();
      const employees = YahooFinanceService.parseNumber($('[data-testid="employees"]').text());
      const website = $('[data-testid="website"] a').attr('href');

      return {
        symbol,
        name: $('h1').text().trim(),
        description: description || undefined,
        sector: sector || undefined,
        employees: employees || undefined,
        website: website || undefined
      };
    } catch (error) {
      console.error(`Error fetching details for ${symbol}:`, error);
      return null;
    }
  }

  private static parseNumber(text: string): number | undefined {
    if (!text || text === '-' || text === 'N/A') return undefined;
    
    const cleaned = text.replace(/[,\s]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? undefined : number;
  }

  private static parsePercentage(text: string): number | undefined {
    if (!text || text === '-' || text === 'N/A') return undefined;
    
    const cleaned = text.replace(/[%\s]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? undefined : number;
  }

  private static parseVolume(text: string): number | undefined {
    if (!text || text === '-' || text === 'N/A') return undefined;
    
    let cleaned = text.replace(/[,\s]/g, '').toLowerCase();
    let multiplier = 1;
    
    if (cleaned.endsWith('k')) {
      multiplier = 1000;
      cleaned = cleaned.slice(0, -1);
    } else if (cleaned.endsWith('m')) {
      multiplier = 1000000;
      cleaned = cleaned.slice(0, -1);
    } else if (cleaned.endsWith('b')) {
      multiplier = 1000000000;
      cleaned = cleaned.slice(0, -1);
    }
    
    const number = parseFloat(cleaned);
    return isNaN(number) ? undefined : number * multiplier;
  }

  private static getFallbackCompanies(): Company[] {
    return [
      { symbol: 'SAN.MC', name: 'Banco Santander' },
      { symbol: 'BBVA.MC', name: 'Banco Bilbao Vizcaya Argentaria' },
      { symbol: 'IBE.MC', name: 'Iberdrola' },
      { symbol: 'ITX.MC', name: 'Inditex' },
      { symbol: 'TEF.MC', name: 'Telefónica' },
      { symbol: 'REP.MC', name: 'Repsol' },
      { symbol: 'CABK.MC', name: 'CaixaBank' },
      { symbol: 'ENG.MC', name: 'Enagás' },
      { symbol: 'ACS.MC', name: 'ACS Group' },
      { symbol: 'FER.MC', name: 'Ferrovial' },
      { symbol: 'AENA.MC', name: 'Aena' },
      { symbol: 'ELE.MC', name: 'Endesa' },
      { symbol: 'GRF.MC', name: 'Grifols' },
      { symbol: 'IAG.MC', name: 'International Airlines Group' },
      { symbol: 'MAP.MC', name: 'Mapfre' },
      { symbol: 'MTS.MC', name: 'ArcelorMittal' },
      { symbol: 'NTGY.MC', name: 'Naturgy Energy' },
      { symbol: 'RED.MC', name: 'Red Eléctrica' },
      { symbol: 'SCYR.MC', name: 'Sacyr' },
      { symbol: 'VIS.MC', name: 'Viscofan' },
      { symbol: 'ANA.MC', name: 'Acciona' },
      { symbol: 'BKT.MC', name: 'Bankinter' },
      { symbol: 'COL.MC', name: 'Inmobiliaria Colonial' },
      { symbol: 'FCC.MC', name: 'FCC' },
      { symbol: 'FDR.MC', name: 'Fluidra' },
      { symbol: 'IDR.MC', name: 'Indra Sistemas' },
      { symbol: 'LOG.MC', name: 'Logista' },
      { symbol: 'MRL.MC', name: 'Merlin Properties' },
      { symbol: 'PHM.MC', name: 'PharmaMar' },
      { symbol: 'ENCE.MC', name: 'Ence Energía y Celulosa' },
      { symbol: 'ACX.MC', name: 'Acerinox' },
      { symbol: 'ALM.MC', name: 'Almirall' },
      { symbol: 'AMS.MC', name: 'Amadeus IT Group' },
      { symbol: 'CLNX.MC', name: 'Cellnex Telecom' },
      { symbol: 'SLR.MC', name: 'Solaria Energía y Medio Ambiente' }
    ];
  }
}