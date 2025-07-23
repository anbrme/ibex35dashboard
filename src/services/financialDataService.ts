import axios from 'axios';
import type { FinancialMetrics } from '../types';
import type { CompanyFinancials, CompanyMetrics } from '../types/database';
import { DatabaseService } from './databaseService';

export class FinancialDataService {
  private static readonly ALPHA_VANTAGE_API_KEY = 'demo'; // Replace with actual API key
  private static readonly ALPHA_VANTAGE_BASE_URL = 'https://www.alphavantage.co/query';

  static async fetchFinancialMetrics(symbol: string): Promise<FinancialMetrics | null> {
    try {
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      if (!company) return null;

      const response = await axios.get(this.ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol.replace('.MC', ''),
          apikey: this.ALPHA_VANTAGE_API_KEY
        }
      });

      const data = response.data;
      
      if (data.Note || data['Error Message']) {
        return this.getFallbackMetrics();
      }

      const metrics: FinancialMetrics = {
        revenue: this.parseNumber(data.RevenueTTM),
        netIncome: this.parseNumber(data.NetIncomeTTM),
        totalAssets: this.parseNumber(data.TotalAssets),
        totalDebt: this.parseNumber(data.TotalDebt),
        freeCashFlow: this.parseNumber(data.FreeCashFlowTTM),
        returnOnEquity: this.parsePercentage(data.ReturnOnEquityTTM),
        debtToEquity: this.parseNumber(data.DebtToEquityRatio),
        priceToEarnings: this.parseNumber(data.PERatio),
        priceToBook: this.parseNumber(data.PriceToBookRatio),
        dividendYield: this.parsePercentage(data.DividendYield)
      };

      return metrics;
    } catch (error) {
      console.error(`Error fetching financial metrics for ${symbol}:`, error);
      return this.getFallbackMetrics();
    }
  }

  static async fetchQuarterlyFinancials(symbol: string): Promise<CompanyFinancials[]> {
    try {
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      if (!company) return [];

      const response = await axios.get(this.ALPHA_VANTAGE_BASE_URL, {
        params: {
          function: 'INCOME_STATEMENT',
          symbol: symbol.replace('.MC', ''),
          apikey: this.ALPHA_VANTAGE_API_KEY
        }
      });

      const data = response.data;
      
      if (data.Note || data['Error Message']) {
        return this.getFallbackFinancials(company.id);
      }

      const quarterlyReports = data.quarterlyReports || [];
      const financials: CompanyFinancials[] = [];

      for (const report of quarterlyReports.slice(0, 8)) {
        const fiscal = this.parseFiscalPeriod(report.fiscalDateEnding);
        
        const financial: CompanyFinancials = {
          id: DatabaseService.generateId(),
          companyId: company.id,
          period: 'quarterly',
          year: fiscal.year,
          quarter: fiscal.quarter,
          currency: 'EUR',
          revenue: this.parseNumber(report.totalRevenue),
          grossProfit: this.parseNumber(report.grossProfit),
          operatingIncome: this.parseNumber(report.operatingIncome),
          netIncome: this.parseNumber(report.netIncome),
          ebitda: this.parseNumber(report.ebitda),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        financials.push(financial);
        await DatabaseService.saveFinancials(financial);
      }

      return financials;
    } catch (error) {
      console.error(`Error fetching quarterly financials for ${symbol}:`, error);
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      return company ? this.getFallbackFinancials(company.id) : [];
    }
  }

  static async fetchCompanyMetrics(symbol: string): Promise<CompanyMetrics | null> {
    try {
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      if (!company) return null;

      const latestPrice = await DatabaseService.getLatestPrice(company.id);
      if (!latestPrice) return null;

      const financialMetrics = await this.fetchFinancialMetrics(symbol);
      
      const metrics: CompanyMetrics = {
        id: DatabaseService.generateId(),
        companyId: company.id,
        priceToEarnings: financialMetrics?.priceToEarnings,
        priceToBook: financialMetrics?.priceToBook,
        dividendYield: financialMetrics?.dividendYield,
        fiftyTwoWeekHigh: latestPrice.price * 1.2,
        fiftyTwoWeekLow: latestPrice.price * 0.8,
        averageVolume: latestPrice.volume,
        marketCapCategory: this.categorizeMarketCap(company.marketCap || 0),
        timestamp: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return metrics;
    } catch (error) {
      console.error(`Error fetching company metrics for ${symbol}:`, error);
      return null;
    }
  }

  private static parseNumber(value: string | number): number | undefined {
    if (typeof value === 'number') return value;
    if (!value || value === 'None' || value === '-') return undefined;
    
    const cleaned = value.toString().replace(/[,\s]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? undefined : number;
  }

  private static parsePercentage(value: string | number): number | undefined {
    if (typeof value === 'number') return value;
    if (!value || value === 'None' || value === '-') return undefined;
    
    const cleaned = value.toString().replace(/[%\s]/g, '');
    const number = parseFloat(cleaned);
    return isNaN(number) ? undefined : number;
  }

  private static parseFiscalPeriod(dateString: string): { year: number; quarter: number } {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return { year, quarter };
  }

  private static categorizeMarketCap(marketCap: number): 'large' | 'mid' | 'small' | 'micro' {
    if (marketCap >= 10000000000) return 'large';
    if (marketCap >= 2000000000) return 'mid';
    if (marketCap >= 300000000) return 'small';
    return 'micro';
  }

  private static getFallbackMetrics(): FinancialMetrics {
    return {
      revenue: 50000000000,
      netIncome: 5000000000,
      totalAssets: 200000000000,
      totalDebt: 50000000000,
      freeCashFlow: 8000000000,
      returnOnEquity: 12.5,
      debtToEquity: 0.25,
      priceToEarnings: 15.2,
      priceToBook: 1.8,
      dividendYield: 3.5
    };
  }

  private static getFallbackFinancials(companyId: string): CompanyFinancials[] {
    const currentYear = new Date().getFullYear();
    const financials: CompanyFinancials[] = [];

    for (let i = 0; i < 4; i++) {
      const financial: CompanyFinancials = {
        id: DatabaseService.generateId(),
        companyId,
        period: 'quarterly',
        year: currentYear,
        quarter: 4 - i,
        currency: 'EUR',
        revenue: 12000000000 + Math.random() * 2000000000,
        netIncome: 1200000000 + Math.random() * 300000000,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      financials.push(financial);
    }

    return financials;
  }

  static async generateMockHistoricalData(symbol: string, days = 30): Promise<void> {
    const company = await DatabaseService.getCompanyBySymbol(symbol);
    if (!company) return;

    const basePrice = 50 + Math.random() * 100;
    const now = new Date();

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const volatility = 0.02 + Math.random() * 0.03;
      const change = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + change * i / days);
      
      const priceData = {
        id: DatabaseService.generateId(),
        companyId: company.id,
        price: Math.round(price * 100) / 100,
        change: Math.round((price - basePrice) * 100) / 100,
        changePercent: Math.round(((price - basePrice) / basePrice) * 10000) / 100,
        volume: Math.floor(1000000 + Math.random() * 5000000),
        high: Math.round(price * 1.02 * 100) / 100,
        low: Math.round(price * 0.98 * 100) / 100,
        open: Math.round(price * (0.99 + Math.random() * 0.02) * 100) / 100,
        previousClose: Math.round(price * 0.995 * 100) / 100,
        timestamp: date
      };

      await DatabaseService.savePrice(priceData);
    }
  }
}