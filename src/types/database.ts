export interface DatabaseCompany {
  id: string;
  symbol: string;
  name: string;
  isin?: string;
  sector?: string;
  industry?: string;
  description?: string;
  employees?: number;
  founded?: number;
  headquarters?: string;
  website?: string;
  ceo?: string;
  marketCap?: number;
  sharesOutstanding?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyPrice {
  id: string;
  companyId: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
}

export interface CompanyShareholder {
  id: string;
  companyId: string;
  name: string;
  type: 'individual' | 'institutional' | 'government' | 'insider' | 'other';
  percentage: number;
  shares: number;
  reportDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyDirector {
  id: string;
  companyId: string;
  name: string;
  position: string;
  isExecutive: boolean;
  age?: number;
  tenure?: number;
  appointmentDate?: Date;
  terminationDate?: Date;
  biography?: string;
  compensation?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyFinancials {
  id: string;
  companyId: string;
  period: 'annual' | 'quarterly';
  year: number;
  quarter?: number;
  currency: string;
  revenue?: number;
  grossProfit?: number;
  operatingIncome?: number;
  netIncome?: number;
  ebitda?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  totalEquity?: number;
  totalDebt?: number;
  freeCashFlow?: number;
  operatingCashFlow?: number;
  investingCashFlow?: number;
  financingCashFlow?: number;
  sharesOutstanding?: number;
  earningsPerShare?: number;
  bookValuePerShare?: number;
  returnOnEquity?: number;
  returnOnAssets?: number;
  debtToEquity?: number;
  currentRatio?: number;
  quickRatio?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  filingDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyMetrics {
  id: string;
  companyId: string;
  priceToEarnings?: number;
  priceToBook?: number;
  priceToSales?: number;
  priceToFreeCashFlow?: number;
  enterpriseValue?: number;
  evToRevenue?: number;
  evToEbitda?: number;
  pegRatio?: number;
  dividendYield?: number;
  dividendPayout?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  marketCapCategory: 'large' | 'mid' | 'small' | 'micro';
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyNews {
  id: string;
  companyId: string;
  title: string;
  summary?: string;
  content?: string;
  url: string;
  source: string;
  author?: string;
  publishedAt: Date;
  sentiment?: 'positive' | 'negative' | 'neutral';
  relevanceScore?: number;
  tags: string[];
  language: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LobbyingMeeting {
  id: string;
  companyId?: string;
  organizationName: string;
  meetingDate: Date;
  location: 'brussels' | 'strasbourg' | 'other';
  euInstitution: 'commission' | 'parliament' | 'council' | 'other';
  meetingType: 'formal' | 'informal' | 'conference' | 'other';
  purpose: string;
  participants: string[];
  topics: string[];
  outcome?: string;
  documentsUrl?: string;
  registrationNumber?: string;
  quarterlySpending?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanyESG {
  id: string;
  companyId: string;
  environmentalScore?: number;
  socialScore?: number;
  governanceScore?: number;
  overallScore?: number;
  carbonFootprint?: number;
  renewableEnergyUsage?: number;
  wasteGeneration?: number;
  waterUsage?: number;
  employeeDiversity?: number;
  boardDiversity?: number;
  executiveCompensationRatio?: number;
  anticorruptionPolicies?: boolean;
  transparencyScore?: number;
  reportingStandard?: string;
  reportDate: Date;
  dataProvider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistCompany {
  id: string;
  userId: string;
  companyId: string;
  notes?: string;
  alertPrice?: number;
  alertType?: 'above' | 'below';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserAlert {
  id: string;
  userId: string;
  companyId: string;
  alertType: 'price' | 'volume' | 'news' | 'earnings' | 'dividend';
  condition: string;
  targetValue?: number;
  isTriggered: boolean;
  triggeredAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type DatabaseTables = {
  companies: DatabaseCompany;
  company_prices: CompanyPrice;
  company_shareholders: CompanyShareholder;
  company_directors: CompanyDirector;
  company_financials: CompanyFinancials;
  company_metrics: CompanyMetrics;
  company_news: CompanyNews;
  lobbying_meetings: LobbyingMeeting;
  company_esg: CompanyESG;
  watchlist_companies: WatchlistCompany;
  user_alerts: UserAlert;
};