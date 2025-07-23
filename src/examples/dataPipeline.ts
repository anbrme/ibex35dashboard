// Data Pipeline Architecture for IBEX35 Intelligence Dashboard

// 1. Data Sources Integration
interface DataSource {
  fetchCompanyData(): Promise<CompanyData[]>;
  fetchMarketData(): Promise<MarketData[]>;
  fetchNewsData(): Promise<NewsItem[]>;
  fetchRegulatoryFilings(): Promise<Filing[]>;
}

// 2. Primary Data Sources
class DataPipeline {
  sources = {
    // Official market data
    bmeMercados: new BMEMercadosAPI(), // Official Spanish stock exchange
    
    // Financial data
    yahoo: new YahooFinanceAPI(),
    alphavantage: new AlphaVantageAPI(),
    
    // Company relationships
    openCorporates: new OpenCorporatesAPI(),
    
    // News and sentiment
    newsAPI: new NewsAPI(),
    gdelt: new GDELTProjectAPI(),
    
    // Regulatory filings
    cnmv: new CNMVScraper(), // Spanish securities regulator
    
    // Social signals
    twitter: new TwitterAPI(),
    reddit: new RedditAPI()
  };
}

// 3. Database Schema (PostgreSQL/Supabase)
const schema = `
-- Core company data
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sector VARCHAR(100),
  sub_sector VARCHAR(100),
  isin VARCHAR(12),
  lei VARCHAR(20), -- Legal Entity Identifier
  headquarters JSONB,
  website VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Real-time market data
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  timestamp TIMESTAMP DEFAULT NOW(),
  price DECIMAL(10,2),
  volume BIGINT,
  market_cap BIGINT,
  pe_ratio DECIMAL(10,2),
  dividend_yield DECIMAL(5,2),
  beta DECIMAL(5,2),
  PRIMARY KEY (company_id, timestamp)
);

-- Directors and board members
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  dni_hash VARCHAR(64), -- Hashed for privacy
  birth_year INTEGER,
  nationality VARCHAR(2),
  bio TEXT,
  linkedin_url VARCHAR(255)
);

CREATE TABLE board_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  person_id UUID REFERENCES people(id),
  position VARCHAR(100),
  committee VARCHAR(100),
  appointed_date DATE,
  end_date DATE,
  compensation DECIMAL(12,2),
  shares_owned BIGINT
);

-- Ownership structure
CREATE TABLE shareholders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255),
  type VARCHAR(50), -- institutional, individual, government
  country VARCHAR(2)
);

CREATE TABLE shareholdings (
  company_id UUID REFERENCES companies(id),
  shareholder_id UUID REFERENCES shareholders(id),
  percentage DECIMAL(5,2),
  shares BIGINT,
  voting_rights DECIMAL(5,2),
  as_of_date DATE,
  PRIMARY KEY (company_id, shareholder_id, as_of_date)
);

-- Corporate relationships
CREATE TABLE company_relationships (
  parent_id UUID REFERENCES companies(id),
  subsidiary_id UUID REFERENCES companies(id),
  relationship_type VARCHAR(50), -- subsidiary, joint_venture, strategic_partner
  ownership_percentage DECIMAL(5,2),
  PRIMARY KEY (parent_id, subsidiary_id)
);

-- News and sentiment
CREATE TABLE news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  published_at TIMESTAMP,
  source VARCHAR(255),
  title TEXT,
  url VARCHAR(500),
  summary TEXT,
  sentiment_score DECIMAL(3,2), -- -1 to 1
  relevance_score DECIMAL(3,2), -- 0 to 1
  entities JSONB -- Extracted entities
);

-- Regulatory filings
CREATE TABLE regulatory_filings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  filing_date DATE,
  filing_type VARCHAR(50),
  title TEXT,
  url VARCHAR(500),
  key_points JSONB,
  material_event BOOLEAN DEFAULT FALSE
);

-- Lobbying activities
CREATE TABLE lobbying_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  year INTEGER,
  amount_eur DECIMAL(12,2),
  lobbyists JSONB,
  issues TEXT[],
  eu_transparency_register VARCHAR(50)
);

-- Create indexes for performance
CREATE INDEX idx_market_data_timestamp ON market_data(timestamp);
CREATE INDEX idx_board_positions_person ON board_positions(person_id);
CREATE INDEX idx_news_sentiment ON news_items(sentiment_score);
CREATE INDEX idx_news_published ON news_items(published_at);
`;

// 4. Data Enrichment Pipeline
class DataEnrichmentPipeline {
  async enrichCompanyData(company: BaseCompany): Promise<EnrichedCompany> {
    const enriched = { ...company };
    
    // Parallel enrichment
    const [
      directors,
      shareholders,
      subsidiaries,
      news,
      filings,
      lobbying
    ] = await Promise.all([
      this.fetchDirectors(company.id),
      this.fetchShareholders(company.id),
      this.fetchSubsidiaries(company.id),
      this.fetchRecentNews(company.id),
      this.fetchRegulatoryFilings(company.id),
      this.fetchLobbyingData(company.id)
    ]);
    
    // Network analysis
    enriched.networkMetrics = this.calculateNetworkMetrics({
      directors,
      shareholders,
      subsidiaries
    });
    
    // Risk scoring
    enriched.riskScore = this.calculateRiskScore({
      news,
      filings,
      marketData: enriched.marketData
    });
    
    return enriched;
  }
  
  calculateNetworkMetrics(data) {
    return {
      centralityScore: this.calculateCentrality(data),
      clusterCoefficient: this.calculateClustering(data),
      bridgingScore: this.calculateBridging(data),
      influenceRadius: this.calculateInfluence(data)
    };
  }
}

// 5. Real-time Updates via WebSocket
class RealtimeDataService {
  private ws: WebSocket;
  private subscribers = new Map();
  
  connect() {
    this.ws = new WebSocket('wss://your-api.com/realtime');
    
    this.ws.on('message', (data) => {
      const update = JSON.parse(data);
      this.notifySubscribers(update.companyId, update);
    });
  }
  
  subscribeToCompany(companyId: string, callback: Function) {
    if (!this.subscribers.has(companyId)) {
      this.subscribers.set(companyId, new Set());
    }
    this.subscribers.get(companyId).add(callback);
    
    // Request real-time updates for this company
    this.ws.send(JSON.stringify({
      action: 'subscribe',
      companyId
    }));
  }
}

// 6. Caching Strategy
class CacheStrategy {
  layers = {
    // L1: In-memory cache for hot data
    memory: new Map(),
    
    // L2: Redis for shared cache
    redis: new RedisClient(),
    
    // L3: CDN for static data
    cdn: new CloudflareCDN()
  };
  
  async get(key: string, fetcher: Function) {
    // Check L1
    if (this.layers.memory.has(key)) {
      return this.layers.memory.get(key);
    }
    
    // Check L2
    const redisValue = await this.layers.redis.get(key);
    if (redisValue) {
      this.layers.memory.set(key, redisValue);
      return redisValue;
    }
    
    // Fetch and cache
    const value = await fetcher();
    await this.cache(key, value);
    return value;
  }
  
  async cache(key: string, value: any, ttl = 300) {
    // Cache in all layers
    this.layers.memory.set(key, value);
    await this.layers.redis.setex(key, ttl, JSON.stringify(value));
  }
}

// 7. API Gateway
class APIGateway {
  // Rate limiting
  rateLimiter = new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100 // requests per window
  });
  
  // GraphQL endpoint for flexible queries
  graphqlSchema = `
    type Company {
      id: ID!
      ticker: String!
      name: String!
      sector: String!
      marketData: MarketData!
      directors: [Person!]!
      shareholders: [Shareholder!]!
      news(limit: Int, sentiment: Float): [NewsItem!]!
      filings(type: String): [Filing!]!
      network: NetworkAnalysis!
    }
    
    type Query {
      company(ticker: String!): Company
      companies(sector: String, minMarketCap: Float): [Company!]!
      searchDirectors(name: String!): [Person!]!
      networkAnalysis(companyIds: [ID!]!): NetworkGraph!
    }
  `;
  
  // REST endpoints for specific use cases
  endpoints = {
    '/api/companies': this.getCompanies,
    '/api/companies/:ticker': this.getCompany,
    '/api/network/:ticker': this.getNetworkData,
    '/api/alerts': this.getAlerts,
    '/api/export': this.exportData
  };
}

// 8. Frontend State Management (Zustand)
interface DashboardStore {
  // Data
  companies: Company[];
  selectedCompanyIds: Set<string>;
  filters: FilterState;
  viewMode: ViewMode;
  
  // Actions
  selectCompany: (id: string) => void;
  deselectCompany: (id: string) => void;
  setFilter: (filter: Partial<FilterState>) => void;
  setViewMode: (mode: ViewMode) => void;
  
  // Async actions
  fetchCompanies: () => Promise<void>;
  fetchCompanyDetails: (id: string) => Promise<void>;
  exportData: (format: string) => Promise<void>;
}

// 9. Performance Optimizations
const optimizations = {
  // Use React Query for server state
  queryClient: new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
      },
    },
  }),
  
  // Virtualization for large lists
  virtualizer: {
    itemHeight: 80,
    overscan: 5,
    scrollingDelay: 150
  },
  
  // Web Workers for heavy computations
  workers: {
    networkAnalysis: new Worker('./workers/network.js'),
    dataProcessing: new Worker('./workers/processor.js')
  },
  
  // Lazy loading and code splitting
  routes: {
    '/network': lazy(() => import('./views/NetworkView')),
    '/analytics': lazy(() => import('./views/AnalyticsView')),
    '/reports': lazy(() => import('./views/ReportsView'))
  }
};

// 10. Deployment Architecture
const deployment = {
  // Frontend: Vercel/Netlify with CDN
  frontend: {
    provider: 'Vercel',
    regions: ['eu-west-1', 'us-east-1'],
    cdn: true,
    prerender: ['/companies', '/about']
  },
  
  // Backend: Supabase + Cloud Functions
  backend: {
    database: 'Supabase',
    functions: 'Cloudflare Workers',
    storage: 'Cloudflare R2',
    cache: 'Upstash Redis'
  },
  
  // Monitoring
  monitoring: {
    apm: 'Sentry',
    analytics: 'Plausible',
    logs: 'Axiom'
  }
};