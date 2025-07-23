export interface RealIBEXCompanyData {
  ticker: string;
  company: string;
  sector: string;
  formattedTicker: string;
  currentPriceEur: number;
  marketCapEur: number;
  volumeEur: number;
}

export class RealGoogleSheetsService {
  private static readonly CORS_PROXY = 'https://api.allorigins.win/raw?url=';
  
  // Configuration - user will need to set these
  private static config = {
    spreadsheetId: '11rpmdk6jWqwueio-aTJYoFBiNCmlnLhZ7jHPbvPrEJ0', // User will provide this
    sheetName: 'Sheet1', // Default sheet name
    range: 'A2:G', // Assuming data starts from row 2, columns A-G
    makePublic: true // Sheet needs to be public for this method
  };

  static setConfig(spreadsheetId: string, sheetName = 'Sheet1', range = 'A2:G') {
    this.config.spreadsheetId = spreadsheetId;
    this.config.sheetName = sheetName;
    this.config.range = range;
  }

  static async fetchRealIBEXData(): Promise<RealIBEXCompanyData[]> {
    if (!this.config.spreadsheetId) {
      console.error('Google Sheets ID not configured. Please call setConfig() first.');
      throw new Error('Google Sheets not configured');
    }

    try {
      // Method 1: Try direct CSV export (requires public sheet)
      return await this.fetchViaCSVExport();
    } catch (error) {
      console.error('Error fetching from Google Sheets:', error);
      throw error;
    }
  }

  private static async fetchViaCSVExport(): Promise<RealIBEXCompanyData[]> {
    // Google Sheets CSV export URL (requires sheet to be public)
    const csvUrl = `https://docs.google.com/spreadsheets/d/${this.config.spreadsheetId}/export?format=csv&gid=0`;
    
    try {
      // Use CORS proxy to avoid CORS issues
      const response = await fetch(`${this.CORS_PROXY}${encodeURIComponent(csvUrl)}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const csvText = await response.text();
      return this.parseCSVData(csvText);
    } catch (error) {
      console.error('Error fetching CSV data:', error);
      throw error;
    }
  }

  private static parseCSVData(csvText: string): RealIBEXCompanyData[] {
    const lines = csvText.split('\n');
    const companies: RealIBEXCompanyData[] = [];
    
    // Skip header row (index 0), start from row 1
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse CSV line (handling quoted values)
      const values = this.parseCSVLine(line);
      
      if (values.length >= 7) {
        try {
          const company: RealIBEXCompanyData = {
            ticker: values[0] || '',
            company: values[1] || '',
            sector: values[2] || '',
            formattedTicker: values[3] || '',
            currentPriceEur: parseFloat(values[4]) || 0,
            marketCapEur: parseFloat(values[5]) || 0,
            volumeEur: parseFloat(values[6]) || 0,
          };
          
          // Only add if we have essential data
          if (company.ticker && company.company && company.currentPriceEur > 0) {
            companies.push(company);
          }
        } catch (error) {
          console.warn(`Error parsing row ${i + 1}:`, line, error);
        }
      }
    }
    
    return companies;
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  // Alternative method using Google Sheets API (requires API key)
  static async fetchViaAPI(apiKey: string): Promise<RealIBEXCompanyData[]> {
    if (!this.config.spreadsheetId) {
      throw new Error('Google Sheets ID not configured');
    }

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.config.spreadsheetId}/values/${this.config.sheetName}!${this.config.range}?key=${apiKey}`;
    
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const rows = data.values || [];
      
      return rows.map((row: string[]) => ({
        ticker: row[0] || '',
        company: row[1] || '',
        sector: row[2] || '',
        formattedTicker: row[3] || '',
        currentPriceEur: parseFloat(row[4]) || 0,
        marketCapEur: parseFloat(row[5]) || 0,
        volumeEur: parseFloat(row[6]) || 0,
      }));
    } catch (error) {
      console.error('Error fetching from Google Sheets API:', error);
      throw error;
    }
  }

  // Helper method to test connection
  static async testConnection(): Promise<boolean> {
    try {
      const data = await this.fetchRealIBEXData();
      console.log(`✅ Successfully connected! Found ${data.length} companies.`);
      console.log('Sample data:', data.slice(0, 3));
      return true;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }
}