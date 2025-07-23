import { YahooFinanceService } from './yahooFinanceService';
import { FinancialDataService } from './financialDataService';
import { NewsService } from './newsService';
import { LobbyingService } from './lobbyingService';
import { DatabaseService } from './databaseService';
import type { DatabaseCompany, CompanyNews } from '../types/database';

export class DataService {
  static async initializeFullDataset(): Promise<void> {
    try {
      console.log('🚀 Initializing IBEX 35 dashboard dataset...');
      
      const companies = await YahooFinanceService.fetchIbex35Companies();
      console.log(`📊 Fetched ${companies.length} companies`);
      
      await DatabaseService.initializeSampleData();
      console.log('📈 Initialized sample financial data');
      
      const topCompanies = companies.slice(0, 5);
      
      for (const company of topCompanies) {
        console.log(`🔄 Processing ${company.name}...`);
        
        await Promise.all([
          FinancialDataService.generateMockHistoricalData(company.symbol, 90),
          NewsService.fetchCompanyNews(company.symbol, 10),
          this.delay(100)
        ]);
      }
      
      await LobbyingService.fetchLobbyingData();
      console.log('🏛️ Fetched lobbying data');
      
      await NewsService.fetchMarketNews(20);
      console.log('📰 Fetched market news');
      
      console.log('✅ Dataset initialization complete!');
    } catch (error) {
      console.error('❌ Error initializing dataset:', error);
      throw error;
    }
  }

  static async getCompanyOverview(symbol: string) {
    try {
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      if (!company) return null;

      const overview = await DatabaseService.getCompanyOverview(company.id);
      
      if (!overview) return null;

      const [metrics, news, lobbying] = await Promise.all([
        FinancialDataService.fetchCompanyMetrics(symbol),
        DatabaseService.getNews(company.id, 5),
        LobbyingService.fetchCompanyLobbyingMeetings(company.id)
      ]);

      return {
        ...overview,
        metrics,
        news,
        lobbying
      };
    } catch (error) {
      console.error(`Error getting company overview for ${symbol}:`, error);
      return null;
    }
  }

  static async getMarketOverview() {
    try {
      const [companies, marketNews, lobbyingStats] = await Promise.all([
        DatabaseService.getAllCompanies(),
        NewsService.fetchMarketNews(10),
        LobbyingService.getLobbyingStats()
      ]);

      const topCompanies = companies.slice(0, 10);
      const companiesWithPrices = await Promise.all(
        topCompanies.map(async (company) => {
          const latestPrice = await DatabaseService.getLatestPrice(company.id);
          return {
            ...company,
            latestPrice
          };
        })
      );

      return {
        companies: companiesWithPrices,
        marketNews,
        lobbyingStats,
        totalCompanies: companies.length
      };
    } catch (error) {
      console.error('Error getting market overview:', error);
      return null;
    }
  }

  static async searchAll(query: string) {
    try {
      const [companies, news] = await Promise.all([
        DatabaseService.searchCompanies(query),
        this.searchNews(query)
      ]);

      return {
        companies,
        news,
        total: companies.length + news.length
      };
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
      return {
        companies: [],
        news: [],
        total: 0
      };
    }
  }

  private static async searchNews(query: string): Promise<CompanyNews[]> {
    try {
      const allCompanies = await DatabaseService.getAllCompanies();
      const allNews: CompanyNews[] = [];
      
      for (const company of allCompanies) {
        const companyNews = await DatabaseService.getNews(company.id, 50);
        allNews.push(...companyNews);
      }
      
      const lowerQuery = query.toLowerCase();
      return allNews.filter(news => 
        news.title.toLowerCase().includes(lowerQuery) ||
        news.summary?.toLowerCase().includes(lowerQuery) ||
        news.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      ).slice(0, 20);
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }

  static async getCompanyFinancialTimeSeries(symbol: string, period: 'daily' | 'weekly' | 'monthly' = 'daily') {
    try {
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      if (!company) return null;

      const priceHistory = await DatabaseService.getPriceHistory(company.id, 365);
      
      let filteredData = priceHistory;
      
      if (period === 'weekly') {
        filteredData = priceHistory.filter((_, index) => index % 7 === 0);
      } else if (period === 'monthly') {
        filteredData = priceHistory.filter((_, index) => index % 30 === 0);
      }

      return {
        company,
        priceData: filteredData.reverse(),
        period
      };
    } catch (error) {
      console.error(`Error getting financial time series for ${symbol}:`, error);
      return null;
    }
  }

  static async refreshCompanyData(symbol: string): Promise<boolean> {
    try {
      console.log(`🔄 Refreshing data for ${symbol}...`);
      
      const [companyDetails] = await Promise.all([
        YahooFinanceService.fetchCompanyDetails(symbol),
        FinancialDataService.fetchQuarterlyFinancials(symbol),
        NewsService.fetchCompanyNews(symbol, 5)
      ]);

      if (companyDetails) {
        await DatabaseService.saveCompany(companyDetails);
      }

      await FinancialDataService.generateMockHistoricalData(symbol, 30);
      
      console.log(`✅ Data refreshed for ${symbol}`);
      return true;
    } catch (error) {
      console.error(`❌ Error refreshing data for ${symbol}:`, error);
      return false;
    }
  }

  static async getTopPerformers(limit = 10) {
    try {
      const companies = await DatabaseService.getAllCompanies();
      const companiesWithPrices = await Promise.all(
        companies.map(async (company) => {
          const latestPrice = await DatabaseService.getLatestPrice(company.id);
          return {
            ...company,
            latestPrice
          };
        })
      );

      const validCompanies = companiesWithPrices.filter(c => c.latestPrice);
      
      const topGainers = validCompanies
        .sort((a, b) => (b.latestPrice?.changePercent || 0) - (a.latestPrice?.changePercent || 0))
        .slice(0, limit);
        
      const topLosers = validCompanies
        .sort((a, b) => (a.latestPrice?.changePercent || 0) - (b.latestPrice?.changePercent || 0))
        .slice(0, limit);
        
      const topVolume = validCompanies
        .sort((a, b) => (b.latestPrice?.volume || 0) - (a.latestPrice?.volume || 0))
        .slice(0, limit);

      return {
        topGainers,
        topLosers,
        topVolume
      };
    } catch (error) {
      console.error('Error getting top performers:', error);
      return {
        topGainers: [],
        topLosers: [],
        topVolume: []
      };
    }
  }

  static async getSectorAnalysis() {
    try {
      const companies = await DatabaseService.getAllCompanies();
      const sectorMap = new Map<string, {
        companies: DatabaseCompany[];
        totalMarketCap: number;
        avgChange: number;
      }>();

      for (const company of companies) {
        const sector = company.sector || 'Other';
        const latestPrice = await DatabaseService.getLatestPrice(company.id);
        
        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, {
            companies: [],
            totalMarketCap: 0,
            avgChange: 0
          });
        }
        
        const sectorData = sectorMap.get(sector)!;
        sectorData.companies.push(company);
        sectorData.totalMarketCap += company.marketCap || 0;
        sectorData.avgChange += latestPrice?.changePercent || 0;
      }

      const sectorAnalysis = Array.from(sectorMap.entries()).map(([sector, data]) => ({
        sector,
        companiesCount: data.companies.length,
        totalMarketCap: data.totalMarketCap,
        avgChange: data.avgChange / data.companies.length,
        companies: data.companies.slice(0, 5)
      }));

      return sectorAnalysis.sort((a, b) => b.totalMarketCap - a.totalMarketCap);
    } catch (error) {
      console.error('Error getting sector analysis:', error);
      return [];
    }
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static async exportData(format: 'json' | 'csv' = 'json') {
    try {
      const [companies, news, lobbying] = await Promise.all([
        DatabaseService.getAllCompanies(),
        this.getAllNews(),
        DatabaseService.getLobbyingMeetings()
      ]);

      const data = {
        companies,
        news: news.slice(0, 100),
        lobbying,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      if (format === 'json') {
        return JSON.stringify(data, null, 2);
      } else {
        return this.convertToCSV(data);
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      throw error;
    }
  }

  private static async getAllNews(): Promise<CompanyNews[]> {
    const companies = await DatabaseService.getAllCompanies();
    const allNews: CompanyNews[] = [];
    
    for (const company of companies) {
      const news = await DatabaseService.getNews(company.id, 20);
      allNews.push(...news);
    }
    
    return allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  private static convertToCSV(data: any): string {
    const csvRows: string[] = [];
    
    csvRows.push('Companies');
    csvRows.push('Symbol,Name,Sector,Market Cap');
    
    for (const company of data.companies) {
      csvRows.push(`${company.symbol},${company.name},${company.sector || ''},${company.marketCap || ''}`);
    }
    
    csvRows.push('');
    csvRows.push('News');
    csvRows.push('Date,Company,Title,Source,Sentiment');
    
    for (const news of data.news.slice(0, 50)) {
      const companyName = data.companies.find((c: any) => c.id === news.companyId)?.name || 'Market';
      csvRows.push(`${news.publishedAt},${companyName},"${news.title}",${news.source},${news.sentiment}`);
    }
    
    return csvRows.join('\n');
  }
}