-- IBEX 35 Intelligence Database Schema
-- Based on the data pipeline architecture from examples/dataPipeline.ts

-- Core company data
CREATE TABLE companies (
  id TEXT PRIMARY KEY,
  ticker TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sector TEXT,
  sub_sector TEXT,
  isin TEXT,
  current_price_eur REAL,
  market_cap_eur INTEGER,
  volume INTEGER,
  change_percent REAL,
  price_change REAL,
  pe_ratio REAL,
  eps REAL,
  high_52 REAL,
  low_52 REAL,
  dividend_yield REAL,
  website TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Directors and board members
CREATE TABLE people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  linkedin_url TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Board positions linking companies and directors
CREATE TABLE board_positions (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  person_id TEXT REFERENCES people(id),
  position TEXT,
  committee TEXT,
  appointed_date TEXT,
  end_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(company_id, person_id, position)
);

-- Historical market data for trends
CREATE TABLE market_data_history (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  price REAL,
  volume INTEGER,
  market_cap INTEGER
);

-- News and sentiment analysis
CREATE TABLE news_items (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id),
  published_at TEXT,
  source TEXT,
  title TEXT,
  url TEXT,
  summary TEXT,
  sentiment_score REAL, -- -1 to 1
  relevance_score REAL, -- 0 to 1
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Data sync tracking
CREATE TABLE sync_logs (
  id TEXT PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'companies', 'directors', 'market_data'
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed'
  records_processed INTEGER DEFAULT 0,
  error_message TEXT
);

-- Create indexes for performance
CREATE INDEX idx_companies_ticker ON companies(ticker);
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_board_positions_company ON board_positions(company_id);
CREATE INDEX idx_board_positions_person ON board_positions(person_id);
CREATE INDEX idx_market_data_company_time ON market_data_history(company_id, timestamp);
CREATE INDEX idx_news_company_published ON news_items(company_id, published_at);
CREATE INDEX idx_sync_logs_type_started ON sync_logs(sync_type, started_at);