export interface Company {
  symbol: string;
  name: string;
  sector?: string;
  marketCap?: number;
  price?: number;
  change?: number;
  changePercent?: number;
  volume?: number;
  priceChange?: number;
  peRatio?: number;
  eps?: number;
  high52?: number;
  low52?: number;
  dividendYield?: number;
}

export interface CompanyDetails extends Company {
  description?: string;
  employees?: number;
  founded?: number;
  headquarters?: string;
  website?: string;
  ceo?: string;
}

export interface Shareholder {
  name: string;
  percentage: number;
  shares: number;
}

export interface Director {
  name: string;
  position: string;
  age?: number;
  tenure?: number;
}

export interface FinancialMetrics {
  revenue?: number;
  netIncome?: number;
  totalAssets?: number;
  totalDebt?: number;
  freeCashFlow?: number;
  returnOnEquity?: number;
  debtToEquity?: number;
  priceToEarnings?: number;
  priceToBook?: number;
  dividendYield?: number;
}