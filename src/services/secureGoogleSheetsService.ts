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
      console.log('🚨🚨🚨 FETCH REAL IBEX DATA CALLED! 🚨🚨🚨');
      console.log('🔒 Using real IBEX 35 data...');
      console.log('🌐 Attempting to fetch from:', `${this.API_BASE_URL}/api/companies`);
      
      // Try D1 endpoint first (fast) with cache busting
      const timestamp = Date.now();
      const response = await fetch(`${this.API_BASE_URL}/api/companies?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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
      console.log('🔍 First company data:', JSON.stringify(rawCompanies[0], null, 2));
      rawCompanies.forEach((rawCompany: any) => {
        console.log(`Ticker: ${rawCompany.ticker}, Price Change: ${rawCompany.price_change}`);
      });
      console.log(`📊 Last updated: ${result.lastUpdated}`);
      
      // Debug: Log raw company data to see available columns
      if (rawCompanies.length > 0) {
        console.log('🔍 Available columns in raw data:', Object.keys(rawCompanies[0]));
        const sampleCompany = rawCompanies.find((c: any) => c.ticker === 'SAN') || rawCompanies[0];
        console.log('🔍 Price change values for sample company:', {
          ticker: sampleCompany.ticker,
          changePercent: sampleCompany.changePercent,
          priceChange: sampleCompany.priceChange
        });
      }

      // Transform API response to match frontend interface
      const companies: SecureIBEXCompanyData[] = rawCompanies.map((rawCompany: any) => ({
        ticker: rawCompany.ticker,
        company: rawCompany.name || rawCompany.company, // Map 'name' to 'company'
        sector: rawCompany.sector,
        formattedTicker: rawCompany.formatted_ticker || rawCompany.formattedTicker || rawCompany.ticker.replace('.MC', ''),
        currentPriceEur: rawCompany.current_price_eur || rawCompany.currentPriceEur || 0,
        marketCapEur: rawCompany.market_cap_eur || rawCompany.marketCapEur || 0,
        volumeEur: rawCompany.volume || rawCompany.volumeEur || 0,
        changePercent: rawCompany.price_change_percentage || rawCompany.change_percent || rawCompany.changePercent || 0,
        priceChange: rawCompany.price_change || rawCompany.priceChange || 0,
        peRatio: rawCompany.pe_ratio || rawCompany.peRatio || null,
        eps: rawCompany.eps || null,
        high52: rawCompany.high_52 || rawCompany.high52 || null,
        low52: rawCompany.low_52 || rawCompany.low52 || null,
        dividendYield: rawCompany.dividend_yield || rawCompany.dividendYield || null,
        directors: (rawCompany.directors || []).map((director: any) => ({
          name: director.name || director.Nombre,
          position: director.position || director.Posición,
          appointmentDate: director.appointedDate || director['Fecha (o fecha último nombramiento)'] || '',
          bioUrl: director.bio || director.bioUrl || director['Url/Bio'] || ''
        })),
        shareholders: (rawCompany.shareholders || []).map((shareholder: any) => ({
          name: shareholder.name || shareholder['Significant Shareholder'],
          type: (shareholder.type || 'other') as 'individual' | 'institutional' | 'government' | 'insider' | 'other',
          percentage: shareholder.percentage || shareholder.Ownership_percentage || 0,
          shares: shareholder.shares || 0,
          reportDate: shareholder.reportDate || shareholder.Date
        }))
      }));
      
      console.log('🎯 Final transformed companies:', companies.length);
      console.log('🎯 First transformed company:', JSON.stringify(companies[0], null, 2));
      return companies;
      
    } catch (error) {
      console.error('❌ Error fetching from secure backend:', error);
      console.log('📡 Failed URL:', this.API_BASE_URL);
      console.log('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // NO MORE MOCK DATA FALLBACK - throw the error to force real data usage
      throw new Error(`Failed to fetch real IBEX data: ${error instanceof Error ? error.message : String(error)}`);
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


  // Helper method to format numbers for display
  static formatNumber(num: number): string {
    if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `€${(num / 1e3).toFixed(1)}K`;
    return `€${num.toFixed(2)}`;
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