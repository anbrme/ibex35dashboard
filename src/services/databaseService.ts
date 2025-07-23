import type { 
  DatabaseCompany, 
  CompanyPrice, 
  CompanyShareholder, 
  CompanyDirector,
  CompanyFinancials,
  CompanyNews,
  LobbyingMeeting 
} from '../types/database';
import type { Company } from '../types';

export class DatabaseService {
  private static companies: Map<string, DatabaseCompany> = new Map();
  private static prices: Map<string, CompanyPrice[]> = new Map();
  private static shareholders: Map<string, CompanyShareholder[]> = new Map();
  private static directors: Map<string, CompanyDirector[]> = new Map();
  private static financials: Map<string, CompanyFinancials[]> = new Map();
  private static news: Map<string, CompanyNews[]> = new Map();
  private static lobbyingMeetings: LobbyingMeeting[] = [];

  static generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  static async saveCompany(company: Company): Promise<DatabaseCompany> {
    const now = new Date();
    const existingCompany = Array.from(this.companies.values())
      .find(c => c.symbol === company.symbol);

    if (existingCompany) {
      const updated: DatabaseCompany = {
        ...existingCompany,
        ...company,
        updatedAt: now
      };
      this.companies.set(existingCompany.id, updated);
      return updated;
    }

    const dbCompany: DatabaseCompany = {
      id: this.generateId(),
      symbol: company.symbol,
      name: company.name,
      sector: company.sector,
      marketCap: company.marketCap,
      createdAt: now,
      updatedAt: now
    };

    this.companies.set(dbCompany.id, dbCompany);

    if (company.price !== undefined) {
      await this.savePrice({
        id: this.generateId(),
        companyId: dbCompany.id,
        price: company.price,
        change: company.change || 0,
        changePercent: company.changePercent || 0,
        volume: company.volume || 0,
        high: company.price,
        low: company.price,
        open: company.price,
        previousClose: company.price - (company.change || 0),
        timestamp: now
      });
    }

    return dbCompany;
  }

  static async savePrice(price: CompanyPrice): Promise<void> {
    const companyPrices = this.prices.get(price.companyId) || [];
    companyPrices.push(price);
    companyPrices.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    if (companyPrices.length > 1000) {
      companyPrices.splice(1000);
    }
    
    this.prices.set(price.companyId, companyPrices);
  }

  static async getCompany(id: string): Promise<DatabaseCompany | null> {
    return this.companies.get(id) || null;
  }

  static async getCompanyBySymbol(symbol: string): Promise<DatabaseCompany | null> {
    return Array.from(this.companies.values())
      .find(c => c.symbol === symbol) || null;
  }

  static async getAllCompanies(): Promise<DatabaseCompany[]> {
    return Array.from(this.companies.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getLatestPrice(companyId: string): Promise<CompanyPrice | null> {
    const prices = this.prices.get(companyId);
    return prices?.[0] || null;
  }

  static async getPriceHistory(companyId: string, limit = 100): Promise<CompanyPrice[]> {
    const prices = this.prices.get(companyId) || [];
    return prices.slice(0, limit);
  }

  static async saveShareholder(shareholder: CompanyShareholder): Promise<void> {
    const shareholders = this.shareholders.get(shareholder.companyId) || [];
    shareholders.push(shareholder);
    this.shareholders.set(shareholder.companyId, shareholders);
  }

  static async getShareholders(companyId: string): Promise<CompanyShareholder[]> {
    return this.shareholders.get(companyId) || [];
  }

  static async saveDirector(director: CompanyDirector): Promise<void> {
    const directors = this.directors.get(director.companyId) || [];
    directors.push(director);
    this.directors.set(director.companyId, directors);
  }

  static async getDirectors(companyId: string): Promise<CompanyDirector[]> {
    return this.directors.get(companyId) || [];
  }

  static async saveFinancials(financial: CompanyFinancials): Promise<void> {
    const financials = this.financials.get(financial.companyId) || [];
    financials.push(financial);
    financials.sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      if (a.quarter && b.quarter) return b.quarter - a.quarter;
      return 0;
    });
    this.financials.set(financial.companyId, financials);
  }

  static async getFinancials(companyId: string): Promise<CompanyFinancials[]> {
    return this.financials.get(companyId) || [];
  }

  static async saveNews(news: CompanyNews): Promise<void> {
    const companyNews = this.news.get(news.companyId) || [];
    companyNews.push(news);
    companyNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
    
    if (companyNews.length > 500) {
      companyNews.splice(500);
    }
    
    this.news.set(news.companyId, companyNews);
  }

  static async getNews(companyId: string, limit = 50): Promise<CompanyNews[]> {
    const news = this.news.get(companyId) || [];
    return news.slice(0, limit);
  }

  static async saveLobbyingMeeting(meeting: LobbyingMeeting): Promise<void> {
    this.lobbyingMeetings.push(meeting);
    this.lobbyingMeetings.sort((a, b) => b.meetingDate.getTime() - a.meetingDate.getTime());
  }

  static async getLobbyingMeetings(companyId?: string): Promise<LobbyingMeeting[]> {
    if (companyId) {
      return this.lobbyingMeetings.filter(m => m.companyId === companyId);
    }
    return this.lobbyingMeetings;
  }

  static async searchCompanies(query: string): Promise<DatabaseCompany[]> {
    const searchTerm = query.toLowerCase();
    return Array.from(this.companies.values())
      .filter(company => 
        company.name.toLowerCase().includes(searchTerm) ||
        company.symbol.toLowerCase().includes(searchTerm) ||
        company.sector?.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  static async getCompanyOverview(companyId: string) {
    const company = await this.getCompany(companyId);
    if (!company) return null;

    const [latestPrice, shareholders, directors, financials, news] = await Promise.all([
      this.getLatestPrice(companyId),
      this.getShareholders(companyId),
      this.getDirectors(companyId),
      this.getFinancials(companyId),
      this.getNews(companyId, 10)
    ]);

    return {
      company,
      latestPrice,
      shareholders: shareholders.filter(s => s.isActive),
      directors: directors.filter(d => d.isActive),
      latestFinancials: financials[0],
      recentNews: news
    };
  }

  static async initializeSampleData(): Promise<void> {
    const sampleShareholders: Omit<CompanyShareholder, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'BlackRock Inc.', type: 'institutional', percentage: 7.2, shares: 720000000, reportDate: new Date('2024-12-01'), isActive: true },
      { name: 'The Vanguard Group', type: 'institutional', percentage: 5.8, shares: 580000000, reportDate: new Date('2024-12-01'), isActive: true },
      { name: 'State Street Corporation', type: 'institutional', percentage: 4.1, shares: 410000000, reportDate: new Date('2024-12-01'), isActive: true }
    ];

    const sampleDirectors: Omit<CompanyDirector, 'id' | 'companyId' | 'createdAt' | 'updatedAt'>[] = [
      { name: 'Ana Botín', position: 'Executive Chairman', isExecutive: true, age: 63, tenure: 10, appointmentDate: new Date('2014-09-15'), isActive: true },
      { name: 'José Antonio Álvarez', position: 'CEO', isExecutive: true, age: 57, tenure: 8, appointmentDate: new Date('2015-01-01'), isActive: true },
      { name: 'Homaira Akbari', position: 'Independent Director', isExecutive: false, age: 59, tenure: 3, appointmentDate: new Date('2021-03-26'), isActive: true }
    ];

    for (const company of this.companies.values()) {
      if (company.symbol === 'SAN.MC') {
        for (const shareholderData of sampleShareholders) {
          await this.saveShareholder({
            id: this.generateId(),
            companyId: company.id,
            ...shareholderData,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        for (const directorData of sampleDirectors) {
          await this.saveDirector({
            id: this.generateId(),
            companyId: company.id,
            ...directorData,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }

        await this.saveFinancials({
          id: this.generateId(),
          companyId: company.id,
          period: 'annual',
          year: 2023,
          currency: 'EUR',
          revenue: 60177000000,
          netIncome: 11075000000,
          totalAssets: 1954421000000,
          totalEquity: 126739000000,
          returnOnEquity: 11.2,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }
  }

  static async clearAll(): Promise<void> {
    this.companies.clear();
    this.prices.clear();
    this.shareholders.clear();
    this.directors.clear();
    this.financials.clear();
    this.news.clear();
    this.lobbyingMeetings.splice(0);
  }
}