// Secure service that calls Cloudflare Workers backend
// No credentials exposed in frontend

export interface SecureIBEXCompanyData {
  ticker: string;
  company: string;
  sector: string;
  formattedTicker: string;
  currentPriceEur: number;
  marketCapEur: number;
  volumeEur: number;
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
  // Your existing Cloudflare Worker
  private static readonly API_BASE_URL = 'https://anurnberg.workers.dev';
  
  static async fetchRealIBEXData(): Promise<SecureIBEXCompanyData[]> {
    try {
      console.log('🔒 Fetching data from secure backend...');
      console.log('📡 API URL:', this.API_BASE_URL);
      
      const response = await fetch(`${this.API_BASE_URL}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: SecureAPIResponse = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown API error');
      }

      const companies = result.data || [];
      console.log(`✅ Successfully loaded ${companies.length} companies from secure backend`);
      console.log(`📊 Last updated: ${result.lastUpdated}`);
      
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

  // Test connection to backend
  static async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}`, {
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
        volumeEur: 45230000
      },
      {
        ticker: 'IBE.MC',
        company: 'Iberdrola',
        sector: 'Utilities',
        formattedTicker: 'IBE',
        currentPriceEur: 12.845,
        marketCapEur: 81340000000,
        volumeEur: 28450000
      },
      {
        ticker: 'ITX.MC',
        company: 'Inditex',
        sector: 'Consumer Discretionary',
        formattedTicker: 'ITX',
        currentPriceEur: 51.26,
        marketCapEur: 159870000000,
        volumeEur: 15680000
      },
      {
        ticker: 'BBVA.MC',
        company: 'Banco Bilbao Vizcaya Argentaria',
        sector: 'Financials',
        formattedTicker: 'BBVA',
        currentPriceEur: 9.876,
        marketCapEur: 63450000000,
        volumeEur: 32100000
      },
      {
        ticker: 'TEF.MC',
        company: 'Telefónica',
        sector: 'Telecommunications',
        formattedTicker: 'TEF',
        currentPriceEur: 3.987,
        marketCapEur: 23890000000,
        volumeEur: 18790000
      },
      {
        ticker: 'REP.MC',
        company: 'Repsol',
        sector: 'Energy',
        formattedTicker: 'REP',
        currentPriceEur: 15.43,
        marketCapEur: 23450000000,
        volumeEur: 12340000
      },
      {
        ticker: 'CABK.MC',
        company: 'CaixaBank',
        sector: 'Financials',
        formattedTicker: 'CABK',
        currentPriceEur: 4.567,
        marketCapEur: 31200000000,
        volumeEur: 21560000
      },
      {
        ticker: 'ACS.MC',
        company: 'ACS Group',
        sector: 'Industrials',
        formattedTicker: 'ACS',
        currentPriceEur: 42.18,
        marketCapEur: 13250000000,
        volumeEur: 2340000
      },
      {
        ticker: 'FER.MC',
        company: 'Ferrovial',
        sector: 'Industrials',
        formattedTicker: 'FER',
        currentPriceEur: 28.95,
        marketCapEur: 21340000000,
        volumeEur: 3450000
      },
      {
        ticker: 'AENA.MC',
        company: 'Aena',
        sector: 'Industrials',
        formattedTicker: 'AENA',
        currentPriceEur: 184.6,
        marketCapEur: 27690000000,
        volumeEur: 1230000
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
}