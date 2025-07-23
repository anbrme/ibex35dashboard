// import { google } from 'googleapis'; // Commented out until Google Sheets integration is implemented

export interface GoogleSheetsCompanyData {
  ticker: string;
  company: string;
  sector: string;
  formattedTicker: string;
  currentPriceEur: number;
  marketCapEur: number;
  volumeEur: number;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  apiKey?: string;
  clientEmail?: string;
  privateKey?: string;
}

export class GoogleSheetsService {
  private static config: GoogleSheetsConfig = {
    spreadsheetId: '', // Will be set via environment or config
    range: 'Sheet1!A2:G', // Assuming header row is A1:G1
    apiKey: import.meta.env.VITE_GOOGLE_SHEETS_API_KEY,
  };

  static setConfig(config: Partial<GoogleSheetsConfig>) {
    this.config = { ...this.config, ...config };
  }

  static async fetchIbex35Data(): Promise<GoogleSheetsCompanyData[]> {
    try {
      // For now, return mock data that matches your Google Sheets structure
      // This will be replaced with actual Google Sheets API call
      return this.getMockIbex35Data();
      
      // Uncomment below when you provide the Google Sheets configuration
      /*
      if (this.config.apiKey && this.config.spreadsheetId) {
        return await this.fetchFromGoogleSheets();
      } else {
        console.warn('Google Sheets API key or spreadsheet ID not configured, using mock data');
        return this.getMockIbex35Data();
      }
      */
    } catch (error) {
      console.error('Error fetching data from Google Sheets:', error);
      return this.getMockIbex35Data();
    }
  }

  /*
  // Future Google Sheets integration function
  private static async fetchFromGoogleSheets(): Promise<GoogleSheetsCompanyData[]> {
    const sheets = google.sheets({ version: 'v4', auth: this.config.apiKey });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: this.config.spreadsheetId,
      range: this.config.range,
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in Google Sheets');
    }

    return rows.map((row: any[]) => ({
      ticker: row[0] || '',
      company: row[1] || '',
      sector: row[2] || '',
      formattedTicker: row[3] || '',
      currentPriceEur: parseFloat(row[4]) || 0,
      marketCapEur: parseFloat(row[5]) || 0,
      volumeEur: parseFloat(row[6]) || 0,
    }));
  }
  */

  // Mock data that represents current IBEX 35 companies with realistic data
  private static getMockIbex35Data(): GoogleSheetsCompanyData[] {
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
        ticker: 'ENG.MC',
        company: 'Enagás',
        sector: 'Energy',
        formattedTicker: 'ENG',
        currentPriceEur: 14.23,
        marketCapEur: 3680000000,
        volumeEur: 4560000
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
      },
      {
        ticker: 'ELE.MC',
        company: 'Endesa',
        sector: 'Utilities',
        formattedTicker: 'ELE',
        currentPriceEur: 19.87,
        marketCapEur: 21040000000,
        volumeEur: 8760000
      },
      {
        ticker: 'GRF.MC',
        company: 'Grifols',
        sector: 'Healthcare',
        formattedTicker: 'GRF',
        currentPriceEur: 11.34,
        marketCapEur: 7650000000,
        volumeEur: 15670000
      },
      {
        ticker: 'IAG.MC',
        company: 'International Airlines Group',
        sector: 'Consumer Discretionary',
        formattedTicker: 'IAG',
        currentPriceEur: 2.456,
        marketCapEur: 12180000000,
        volumeEur: 45670000
      },
      {
        ticker: 'MAP.MC',
        company: 'Mapfre',
        sector: 'Financials',
        formattedTicker: 'MAP',
        currentPriceEur: 2.134,
        marketCapEur: 6540000000,
        volumeEur: 8900000
      },
      {
        ticker: 'MTS.MC',
        company: 'ArcelorMittal',
        sector: 'Materials',
        formattedTicker: 'MTS',
        currentPriceEur: 23.67,
        marketCapEur: 21340000000,
        volumeEur: 5670000
      },
      {
        ticker: 'NTGY.MC',
        company: 'Naturgy Energy',
        sector: 'Utilities',
        formattedTicker: 'NTGY',
        currentPriceEur: 28.45,
        marketCapEur: 12890000000,
        volumeEur: 3450000
      },
      {
        ticker: 'RED.MC',
        company: 'Red Eléctrica',
        sector: 'Utilities',
        formattedTicker: 'RED',
        currentPriceEur: 16.78,
        marketCapEur: 11230000000,
        volumeEur: 2340000
      },
      {
        ticker: 'SCYR.MC',
        company: 'Sacyr',
        sector: 'Industrials',
        formattedTicker: 'SCYR',
        currentPriceEur: 3.567,
        marketCapEur: 2130000000,
        volumeEur: 12340000
      },
      {
        ticker: 'VIS.MC',
        company: 'Viscofan',
        sector: 'Consumer Staples',
        formattedTicker: 'VIS',
        currentPriceEur: 58.2,
        marketCapEur: 2890000000,
        volumeEur: 890000
      },
      {
        ticker: 'ANA.MC',
        company: 'Acciona',
        sector: 'Industrials',
        formattedTicker: 'ANA',
        currentPriceEur: 134.5,
        marketCapEur: 7890000000,
        volumeEur: 1230000
      },
      {
        ticker: 'BKT.MC',
        company: 'Bankinter',
        sector: 'Financials',
        formattedTicker: 'BKT',
        currentPriceEur: 6.789,
        marketCapEur: 6120000000,
        volumeEur: 4560000
      },
      {
        ticker: 'COL.MC',
        company: 'Inmobiliaria Colonial',
        sector: 'Real Estate',
        formattedTicker: 'COL',
        currentPriceEur: 7.234,
        marketCapEur: 3450000000,
        volumeEur: 5670000
      },
      {
        ticker: 'FCC.MC',
        company: 'FCC',
        sector: 'Industrials',
        formattedTicker: 'FCC',
        currentPriceEur: 12.45,
        marketCapEur: 4980000000,
        volumeEur: 2340000
      },
      {
        ticker: 'FDR.MC',
        company: 'Fluidra',
        sector: 'Consumer Discretionary',
        formattedTicker: 'FDR',
        currentPriceEur: 14.67,
        marketCapEur: 2560000000,
        volumeEur: 1890000
      },
      {
        ticker: 'IDR.MC',
        company: 'Indra Sistemas',
        sector: 'Technology',
        formattedTicker: 'IDR',
        currentPriceEur: 15.23,
        marketCapEur: 2730000000,
        volumeEur: 3450000
      },
      {
        ticker: 'LOG.MC',
        company: 'Logista',
        sector: 'Consumer Staples',
        formattedTicker: 'LOG',
        currentPriceEur: 23.8,
        marketCapEur: 2890000000,
        volumeEur: 890000
      },
      {
        ticker: 'MRL.MC',
        company: 'Merlin Properties',
        sector: 'Real Estate',
        formattedTicker: 'MRL',
        currentPriceEur: 10.45,
        marketCapEur: 5670000000,
        volumeEur: 2340000
      },
      {
        ticker: 'PHM.MC',
        company: 'PharmaMar',
        sector: 'Healthcare',
        formattedTicker: 'PHM',
        currentPriceEur: 18.95,
        marketCapEur: 1890000000,
        volumeEur: 4560000
      },
      {
        ticker: 'ENCE.MC',
        company: 'Ence Energía y Celulosa',
        sector: 'Materials',
        formattedTicker: 'ENCE',
        currentPriceEur: 2.890,
        marketCapEur: 760000000,
        volumeEur: 6780000
      },
      {
        ticker: 'ACX.MC',
        company: 'Acerinox',
        sector: 'Materials',
        formattedTicker: 'ACX',
        currentPriceEur: 10.23,
        marketCapEur: 2890000000,
        volumeEur: 3450000
      },
      {
        ticker: 'ALM.MC',
        company: 'Almirall',
        sector: 'Healthcare',
        formattedTicker: 'ALM',
        currentPriceEur: 9.87,
        marketCapEur: 1890000000,
        volumeEur: 2340000
      },
      {
        ticker: 'AMS.MC',
        company: 'Amadeus IT Group',
        sector: 'Technology',
        formattedTicker: 'AMS',
        currentPriceEur: 73.4,
        marketCapEur: 33450000000,
        volumeEur: 1230000
      },
      {
        ticker: 'CLNX.MC',
        company: 'Cellnex Telecom',
        sector: 'Telecommunications',
        formattedTicker: 'CLNX',
        currentPriceEur: 37.6,
        marketCapEur: 25670000000,
        volumeEur: 2340000
      },
      {
        ticker: 'SLR.MC',
        company: 'Solaria Energía y Medio Ambiente',
        sector: 'Utilities',
        formattedTicker: 'SLR',
        currentPriceEur: 11.89,
        marketCapEur: 1990000000,
        volumeEur: 8900000
      }
    ];
  }

  // Generate mock historical data for charts
  static generateMockHistoricalData(ticker: string, days = 30): Array<{
    date: Date;
    price: number;
    volume: number;
    change: number;
    changePercent: number;
  }> {
    const currentData = this.getMockIbex35Data().find(c => c.ticker === ticker);
    if (!currentData) return [];

    const basePrice = currentData.currentPriceEur;
    const baseVolume = currentData.volumeEur;
    const historicalData = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic price variation (±3% daily volatility)
      const volatility = 0.03;
      const randomChange = (Math.random() - 0.5) * volatility;
      const price = basePrice * (1 + randomChange * (i / days));
      
      // Calculate change from previous day
      const previousPrice: number = i === days ? basePrice : historicalData[historicalData.length - 1]?.price || basePrice;
      const change: number = price - previousPrice;
      const changePercent: number = (change / previousPrice) * 100;
      
      // Generate volume variation (±50% of base volume)
      const volumeVariation = 0.5;
      const volume = baseVolume * (0.5 + Math.random() * volumeVariation);

      historicalData.push({
        date,
        price: Math.round(price * 1000) / 1000,
        volume: Math.round(volume),
        change: Math.round(change * 1000) / 1000,
        changePercent: Math.round(changePercent * 100) / 100
      });
    }

    return historicalData;
  }

  // Method to update configuration (for when user provides their Google Sheets details)
  static updateConfig(spreadsheetId: string, apiKey?: string) {
    this.config.spreadsheetId = spreadsheetId;
    if (apiKey) this.config.apiKey = apiKey;
  }
}