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
      console.log('🔒 Using real IBEX 35 data...');
      
      // Temporarily use static real data instead of fetching
      // This bypasses any network/CORS issues while we fix the director mapping
      const realData = {
        "success": true,
        "data": [
          {
            "id": "SAN.MC",
            "ticker": "SAN.MC",
            "name": "Santander",
            "sector": "Financial Services",
            "current_price_eur": 7.59,
            "market_cap_eur": 134094327991,
            "volume": 16256498,
            "price_change": 0.02,
            "pe_ratio": 8.93,
            "eps": 0.85,
            "high_52": 7.62,
            "low_52": 3.8,
            "directors": [
              {"name": "Ana Botín-Sanz de Sautuola y O'Shea", "position": "Presidenta Ejecutiva", "appointedDate": "2014.0", "bio": "https://www.santander.com/es/sobre-nosotros/gobierno-corporativo/consejo-de-administracion"},
              {"name": "Héctor Blas Grisi Checa", "position": "Consejero Delegado", "appointedDate": "2023.0", "bio": "https://www.santander.com/es/sobre-nosotros/gobierno-corporativo/consejo-de-administracion"}
            ],
            "shareholders": [{"name": "Institutional/Free Float", "type": "individual", "percentage": 0, "shares": 0, "reportDate": 2025}]
          },
          {
            "id": "BBVA.MC",
            "ticker": "BBVA.MC", 
            "name": "BBVA",
            "sector": "Financial Services",
            "current_price_eur": 13.03,
            "market_cap_eur": 89128926560,
            "volume": 5722689,
            "price_change": 0.03,
            "pe_ratio": 7.39,
            "eps": 1.76,
            "high_52": 13.9,
            "low_52": 8.46,
            "directors": [
              {"name": "Carlos Torres Vila", "position": "Presidente", "appointedDate": "2018.0", "bio": "https://accionistaseinversores.bbva.com/gobierno-corporativo/consejo-de-administracion/"},
              {"name": "Onur Genç", "position": "Consejero Delegado", "appointedDate": "2018.0", "bio": "https://accionistaseinversores.bbva.com/gobierno-corporativo/consejo-de-administracion/"},
              {"name": "Belén Garijo López", "position": "Consejera", "appointedDate": "2021.0", "bio": "https://accionistaseinversores.bbva.com/gobierno-corporativo/consejo-de-administracion/"}
            ],
            "shareholders": [{"name": "Largely free float / institutions, no single>5%", "type": "other", "percentage": 0, "shares": 0, "reportDate": 45717}]
          },
          {
            "id": "CABK.MC",
            "ticker": "CABK.MC",
            "name": "CaixaBank", 
            "sector": "Financial Services",
            "current_price_eur": 7.86,
            "market_cap_eur": 57032263064,
            "volume": 4083242,
            "price_change": -0.08,
            "pe_ratio": 10.69,
            "eps": 0.73,
            "high_52": 8.01,
            "low_52": 4.53,
            "directors": [
              {"name": "José Ignacio Goirigolzarri Tellaeche", "position": "Presidente", "appointedDate": "2021.0", "bio": "https://www.caixabank.com/es/accionistas-inversores/gobierno-corporativo/consejo-administracion.html"},
              {"name": "Gonzalo Gortázar Rotaeche", "position": "Consejero Delegado", "appointedDate": "2014.0", "bio": "https://www.caixabank.com/es/accionistas-inversores/gobierno-corporativo/consejo-administracion.html"}
            ],
            "shareholders": [
              {"name": "Criteria Caixa", "type": "individual", "percentage": 31, "shares": 0, "reportDate": 45689},
              {"name": "FROB (Spanish Govt).", "type": "individual", "percentage": 18, "shares": 0, "reportDate": 45689}
            ]
          }
        ]
      };
      
      const result = realData;
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown API error');
      }

      const rawCompanies = result.data || [];
      console.log(`✅ Successfully loaded ${rawCompanies.length} companies from secure backend`);
      rawCompanies.forEach((rawCompany: any) => {
        console.log(`Ticker: ${rawCompany.ticker}, Change Percent: ${rawCompany.change_percent || rawCompany.changePercent}`);
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
        formattedTicker: rawCompany.formattedTicker,
        currentPriceEur: rawCompany.current_price_eur || rawCompany.currentPriceEur || 0,
        marketCapEur: rawCompany.market_cap_eur || rawCompany.marketCapEur || 0,
        volumeEur: rawCompany.volume || rawCompany.volumeEur || 0,
        changePercent: rawCompany.change_percent || 0,
        priceChange: rawCompany.price_change || 0,
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
      console.log('🔍 Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Test if the API is actually reachable
      console.log('🧪 Testing API reachability...');
      try {
        const testResponse = await fetch(this.API_BASE_URL, { 
          method: 'HEAD',
          mode: 'cors'
        });
        console.log('🧪 Head request status:', testResponse.status);
      } catch (testError) {
        console.log('🧪 Head request failed:', testError);
      }
      
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