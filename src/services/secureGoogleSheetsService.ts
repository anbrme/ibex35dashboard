// Secure service that calls Cloudflare Workers backend
// No credentials exposed in frontend

export interface Director {
  name: string;
  position: string;
  appointmentDate: string;
  bioUrl: string;
}

export interface Shareholder {
  name: string;
  type: 'individual' | 'institutional' | 'government' | 'insider' | 'other';
  percentage: number;
  shares?: number;
  reportDate: string;
}

export interface SecureIBEXCompanyData {
  ticker: string;
  company: string;
  sector: string;
  formattedTicker?: string;
  currentPriceEur: number;
  marketCapEur: number;
  volumeEur: number;
  changePercent?: number;
  priceChange?: number;
  peRatio?: number;
  eps?: number;
  high52?: number;
  low52?: number;
  dividendYield?: number;
  directors: Director[];
  shareholders?: Shareholder[];
}

export interface SecureAPIResponse {
  success: boolean;
  data?: SecureIBEXCompanyData[];
  count?: number;
  lastUpdated?: string;
  error?: string;
  timestamp?: string;
}

export class SecureGoogleSheetsService {
  // Use D1-powered Cloudflare Worker
  private static readonly API_BASE_URL = 'https://ibex35-sheets-api.anurnberg.workers.dev';
  
  static async fetchRealIBEXData(): Promise<SecureIBEXCompanyData[]> {
    try {
      console.log('🔒 Fetching data from D1-powered backend...');
      console.log('📡 API URL:', this.API_BASE_URL);
      
      // Try D1 endpoint first (fast)
      const response = await fetch(`${this.API_BASE_URL}/api/companies`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'max-age=60' // 1-minute client cache
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SecureAPIResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown API error');
      }

      const rawCompanies = result.data || [];
      console.log(`✅ Successfully loaded ${rawCompanies.length} companies from secure backend`);
      rawCompanies.forEach((rawCompany: any) => {
        console.log(`Ticker: ${rawCompany.ticker}, Change Percent: ${rawCompany.change_percent || rawCompany.changePercent}`);
      });
      console.log(`📊 Last updated: ${result.lastUpdated}`);
      
      // Transform API response to match frontend interface
      const companies: SecureIBEXCompanyData[] = rawCompanies.map((rawCompany: any) => ({
        ticker: rawCompany.ticker,
        company: rawCompany.name || rawCompany.company, // Map 'name' to 'company'
        sector: rawCompany.sector,
        formattedTicker: rawCompany.formattedTicker,
        currentPriceEur: rawCompany.current_price_eur || rawCompany.currentPriceEur || 0,
        marketCapEur: rawCompany.market_cap_eur || rawCompany.marketCapEur || 0,
        volumeEur: rawCompany.volume || rawCompany.volumeEur || 0,
        changePercent: rawCompany.change_percent || rawCompany.changePercent || 0,
        priceChange: rawCompany.price_change || rawCompany.priceChange || 0,
        peRatio: rawCompany.pe_ratio || rawCompany.peRatio || null,
        eps: rawCompany.eps || null,
        high52: rawCompany.high_52 || rawCompany.high52 || null,
        low52: rawCompany.low_52 || rawCompany.low52 || null,
        dividendYield: rawCompany.dividend_yield || rawCompany.dividendYield || null,
        directors: (rawCompany.directors || []).map((director: any) => ({
          name: director.name,
          position: director.position,
          appointmentDate: director.appointedDate || director.appointmentDate || '',
          bioUrl: director.bio || director.bioUrl || ''
        })),
        shareholders: (rawCompany.shareholders || []).map((shareholder: any) => ({
          name: shareholder.name,
          type: shareholder.type as 'individual' | 'institutional' | 'government' | 'insider' | 'other',
          percentage: shareholder.percentage,
          shares: shareholder.shares,
          reportDate: shareholder.reportDate
        }))
      }));
      
      return companies;
      
    } catch (error) {
      console.error('❌ Error fetching from secure backend:', error);
      console.log('📡 Failed URL:', this.API_BASE_URL);
      console.log('💡 Please check your Cloudflare Worker is deployed and the URL is correct');
      
      // Fallback to mock data if backend fails
      console.log('🔄 Falling back to mock data...');
      return this.getMockData();
    }
  }

  // Sync data from Google Sheets to D1 database
  static async syncData(): Promise<boolean> {
    try {
      console.log('🔄 Triggering data sync...');
      const response = await fetch(`${this.API_BASE_URL}/api/sync`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Data sync completed:', result);
        return result.success;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Data sync failed:', error);
      return false;
    }
  }

  // Get network data for visualization
  static async getNetworkData(selectedTickers: string[] = []): Promise<any[]> {
    try {
      const tickersParam = selectedTickers.length > 0 ? `?tickers=${selectedTickers.join(',')}` : '';
      const response = await fetch(`${this.API_BASE_URL}/api/network${tickersParam}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        return result.data || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Network data fetch failed:', error);
      return [];
    }
  }

  // Test connection to backend
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/companies`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('🔒 Backend connection test:', result.success ? '✅ Success' : '❌ Failed');
        return result.success;
      }
      
      return false;
    } catch (error) {
      console.error('🔒 Backend connection test failed:', error);
      return false;
    }
  }

  // Mock data for development/fallback
  private static getMockData(): SecureIBEXCompanyData[] {
    console.log('📝 Using mock data - configure Cloudflare Workers for real data');
    
    return [
      {
        ticker: 'SAN.MC',
        company: 'Banco Santander',
        sector: 'Financials',
        formattedTicker: 'SAN',
        currentPriceEur: 4.234,
        marketCapEur: 65240000000,
        volumeEur: 45230000,
        directors: [
          { name: 'Ana Botín', position: 'Presidente', appointmentDate: '2014-09-10', bioUrl: '' },
          { name: 'José Antonio Álvarez', position: 'Consejero Delegado', appointmentDate: '2015-01-01', bioUrl: '' }
        ]
      },
      {
        ticker: 'IBE.MC',
        company: 'Iberdrola',
        sector: 'Utilities',
        formattedTicker: 'IBE',
        currentPriceEur: 12.845,
        marketCapEur: 81340000000,
        volumeEur: 28450000,
        directors: [{ name: 'Ignacio Galán', position: 'Presidente', appointmentDate: '2006-04-28', bioUrl: '' }]
      },
      {
        ticker: 'ITX.MC',
        company: 'Inditex',
        sector: 'Consumer Discretionary',
        formattedTicker: 'ITX',
        currentPriceEur: 51.26,
        marketCapEur: 159870000000,
        volumeEur: 15680000,
        directors: [{ name: 'Marta Ortega', position: 'Presidenta', appointmentDate: '2022-04-01', bioUrl: '' }]
      },
      {
        ticker: 'BBVA.MC',
        company: 'Banco Bilbao Vizcaya Argentaria',
        sector: 'Financials',
        formattedTicker: 'BBVA',
        currentPriceEur: 9.876,
        marketCapEur: 63450000000,
        volumeEur: 32100000,
        directors: [{ name: 'Carlos Torres', position: 'Presidente', appointmentDate: '2018-12-21', bioUrl: '' }]
      },
      {
        ticker: 'TEF.MC',
        company: 'Telefónica',
        sector: 'Telecommunications',
        formattedTicker: 'TEF',
        currentPriceEur: 3.987,
        marketCapEur: 23890000000,
        volumeEur: 18790000,
        directors: []
      },
      {
        ticker: 'REP.MC',
        company: 'Repsol',
        sector: 'Energy',
        formattedTicker: 'REP',
        currentPriceEur: 15.43,
        marketCapEur: 23450000000,
        volumeEur: 12340000,
        directors: []
      },
      {
        ticker: 'CABK.MC',
        company: 'CaixaBank',
        sector: 'Financials',
        formattedTicker: 'CABK',
        currentPriceEur: 4.567,
        marketCapEur: 31200000000,
        volumeEur: 21560000,
        directors: []
      },
      {
        ticker: 'ACS.MC',
        company: 'ACS Group',
        sector: 'Industrials',
        formattedTicker: 'ACS',
        currentPriceEur: 42.18,
        marketCapEur: 13250000000,
        volumeEur: 2340000,
        directors: []
      },
      {
        ticker: 'FER.MC',
        company: 'Ferrovial',
        sector: 'Industrials',
        formattedTicker: 'FER',
        currentPriceEur: 28.95,
        marketCapEur: 21340000000,
        volumeEur: 3450000,
        directors: []
      },
      {
        ticker: 'AENA.MC',
        company: 'Aena',
        sector: 'Industrials',
        formattedTicker: 'AENA',
        currentPriceEur: 184.6,
        marketCapEur: 27690000000,
        volumeEur: 1230000,
        directors: []
      }
    ];
  }

  // Helper method to format numbers for display
  static formatNumber(num: number): string {
    if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `€${(num / 1e3).toFixed(1)}K`;
    return `€${num.toFixed(2)}`;
  }

  // Helper method to calculate change percentage (mock for now)
  static calculateMockChange(): { change: number; changePercent: number } {
    const changePercent = (Math.random() - 0.5) * 6; // ±3%
    const change = changePercent / 100; // Convert to decimal
    return {
      change: Math.round(change * 1000) / 1000,
      changePercent: Math.round(changePercent * 100) / 100
    };
  }

  // Helper method to safely format numbers that might be null/undefined
  static safeToFixed(value: number | null | undefined, decimals: number = 2): string {
    return (value || 0).toFixed(decimals);
  }

  // Helper method to safely format currency that might be null/undefined
  static safeCurrency(value: number | null | undefined, decimals: number = 2): string {
    return `€${this.safeToFixed(value, decimals)}`;
  }
}