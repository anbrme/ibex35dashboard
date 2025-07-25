-- IBEX 35 Dashboard Database Schema
-- Compatible with PostgreSQL, MySQL, and SQLite with minor modifications

-- Core Companies table
CREATE TABLE companies (
    id VARCHAR(36) PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    isin VARCHAR(12),
    sector VARCHAR(100),
    industry VARCHAR(100),
    description TEXT,
    employees INTEGER,
    founded INTEGER,
    headquarters VARCHAR(255),
    website VARCHAR(500),
    ceo VARCHAR(255),
    market_cap BIGINT,
    shares_outstanding BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Real-time and historical price data
CREATE TABLE company_prices (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    price DECIMAL(10,4) NOT NULL,
    change_amount DECIMAL(10,4),
    change_percent DECIMAL(8,4),
    volume BIGINT,
    high DECIMAL(10,4),
    low DECIMAL(10,4),
    open DECIMAL(10,4),
    previous_close DECIMAL(10,4),
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Company shareholders and ownership structure
CREATE TABLE company_shareholders (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    ticker VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    type ENUM('individual', 'institutional', 'government', 'insider', 'other') NOT NULL,
    percentage DECIMAL(5,2) NOT NULL,
    shares BIGINT NOT NULL,
    report_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Board of directors and key executives
CREATE TABLE company_directors (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    is_executive BOOLEAN DEFAULT FALSE,
    age INTEGER,
    tenure INTEGER,
    appointment_date DATE,
    termination_date DATE,
    biography TEXT,
    compensation DECIMAL(15,2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Financial statements data (quarterly and annual)
CREATE TABLE company_financials (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    period ENUM('annual', 'quarterly') NOT NULL,
    year INTEGER NOT NULL,
    quarter INTEGER,
    currency VARCHAR(3) DEFAULT 'EUR',
    revenue BIGINT,
    gross_profit BIGINT,
    operating_income BIGINT,
    net_income BIGINT,
    ebitda BIGINT,
    total_assets BIGINT,
    total_liabilities BIGINT,
    total_equity BIGINT,
    total_debt BIGINT,
    free_cash_flow BIGINT,
    operating_cash_flow BIGINT,
    investing_cash_flow BIGINT,
    financing_cash_flow BIGINT,
    shares_outstanding BIGINT,
    earnings_per_share DECIMAL(10,4),
    book_value_per_share DECIMAL(10,4),
    return_on_equity DECIMAL(8,4),
    return_on_assets DECIMAL(8,4),
    debt_to_equity DECIMAL(8,4),
    current_ratio DECIMAL(8,4),
    quick_ratio DECIMAL(8,4),
    gross_margin DECIMAL(8,4),
    operating_margin DECIMAL(8,4),
    net_margin DECIMAL(8,4),
    filing_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_period (company_id, period, year, quarter)
);

-- Valuation and trading metrics
CREATE TABLE company_metrics (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    price_to_earnings DECIMAL(10,4),
    price_to_book DECIMAL(10,4),
    price_to_sales DECIMAL(10,4),
    price_to_free_cash_flow DECIMAL(10,4),
    enterprise_value BIGINT,
    ev_to_revenue DECIMAL(10,4),
    ev_to_ebitda DECIMAL(10,4),
    peg_ratio DECIMAL(10,4),
    dividend_yield DECIMAL(8,4),
    dividend_payout DECIMAL(8,4),
    beta DECIMAL(8,4),
    fifty_two_week_high DECIMAL(10,4),
    fifty_two_week_low DECIMAL(10,4),
    average_volume BIGINT,
    market_cap_category ENUM('large', 'mid', 'small', 'micro') NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- News and press releases
CREATE TABLE company_news (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    title VARCHAR(500) NOT NULL,
    summary TEXT,
    content LONGTEXT,
    url VARCHAR(1000) NOT NULL,
    source VARCHAR(255) NOT NULL,
    author VARCHAR(255),
    published_at TIMESTAMP NOT NULL,
    sentiment ENUM('positive', 'negative', 'neutral'),
    relevance_score DECIMAL(3,2),
    tags JSON,
    language VARCHAR(5) DEFAULT 'es',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- EU lobbying and transparency data
CREATE TABLE lobbying_meetings (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36),
    organization_name VARCHAR(255) NOT NULL,
    meeting_date DATE NOT NULL,
    location ENUM('brussels', 'strasbourg', 'other') NOT NULL,
    eu_institution ENUM('commission', 'parliament', 'council', 'other') NOT NULL,
    meeting_type ENUM('formal', 'informal', 'conference', 'other') NOT NULL,
    purpose TEXT NOT NULL,
    participants JSON NOT NULL,
    topics JSON NOT NULL,
    outcome TEXT,
    documents_url VARCHAR(1000),
    registration_number VARCHAR(50),
    quarterly_spending DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL
);

-- ESG (Environmental, Social, Governance) scores and data
CREATE TABLE company_esg (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    environmental_score DECIMAL(5,2),
    social_score DECIMAL(5,2),
    governance_score DECIMAL(5,2),
    overall_score DECIMAL(5,2),
    carbon_footprint DECIMAL(15,2),
    renewable_energy_usage DECIMAL(5,2),
    waste_generation DECIMAL(15,2),
    water_usage DECIMAL(15,2),
    employee_diversity DECIMAL(5,2),
    board_diversity DECIMAL(5,2),
    executive_compensation_ratio DECIMAL(10,2),
    anticorruption_policies BOOLEAN,
    transparency_score DECIMAL(5,2),
    reporting_standard VARCHAR(50),
    report_date DATE NOT NULL,
    data_provider VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- User watchlists and portfolio tracking
CREATE TABLE watchlist_companies (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    notes TEXT,
    alert_price DECIMAL(10,4),
    alert_type ENUM('above', 'below'),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_company (user_id, company_id)
);

-- Price and event alerts system
CREATE TABLE user_alerts (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    company_id VARCHAR(36) NOT NULL,
    alert_type ENUM('price', 'volume', 'news', 'earnings', 'dividend') NOT NULL,
    condition_text VARCHAR(500) NOT NULL,
    target_value DECIMAL(15,4),
    is_triggered BOOLEAN DEFAULT FALSE,
    triggered_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Indexes for performance optimization
CREATE INDEX idx_companies_symbol ON companies(symbol);
CREATE INDEX idx_companies_sector ON companies(sector);
CREATE INDEX idx_company_prices_company_timestamp ON company_prices(company_id, timestamp);
CREATE INDEX idx_company_prices_timestamp ON company_prices(timestamp);
CREATE INDEX idx_company_shareholders_company ON company_shareholders(company_id);
CREATE INDEX idx_company_directors_company ON company_directors(company_id);
CREATE INDEX idx_company_financials_company_period ON company_financials(company_id, period, year, quarter);
CREATE INDEX idx_company_metrics_company_timestamp ON company_metrics(company_id, timestamp);
CREATE INDEX idx_company_news_company_published ON company_news(company_id, published_at);
CREATE INDEX idx_company_news_published ON company_news(published_at);
CREATE INDEX idx_lobbying_meetings_company ON lobbying_meetings(company_id);
CREATE INDEX idx_lobbying_meetings_date ON lobbying_meetings(meeting_date);
CREATE INDEX idx_company_esg_company_date ON company_esg(company_id, report_date);
CREATE INDEX idx_watchlist_user ON watchlist_companies(user_id);
CREATE INDEX idx_user_alerts_user_active ON user_alerts(user_id, is_active);
CREATE INDEX idx_user_alerts_company ON user_alerts(company_id);

-- Views for common queries
CREATE VIEW v_latest_prices AS
SELECT DISTINCT
    cp.*,
    c.symbol,
    c.name
FROM company_prices cp
INNER JOIN companies c ON cp.company_id = c.id
INNER JOIN (
    SELECT company_id, MAX(timestamp) as latest_timestamp
    FROM company_prices
    GROUP BY company_id
) latest ON cp.company_id = latest.company_id AND cp.timestamp = latest.latest_timestamp;

CREATE VIEW v_company_overview AS
SELECT 
    c.*,
    lp.price,
    lp.change_amount,
    lp.change_percent,
    lp.volume,
    cm.price_to_earnings,
    cm.price_to_book,
    cm.dividend_yield,
    cm.market_cap_category
FROM companies c
LEFT JOIN v_latest_prices lp ON c.id = lp.company_id
LEFT JOIN (
    SELECT DISTINCT company_id, price_to_earnings, price_to_book, dividend_yield, market_cap_category
    FROM company_metrics cm1
    WHERE timestamp = (
        SELECT MAX(timestamp) 
        FROM company_metrics cm2 
        WHERE cm2.company_id = cm1.company_id
    )
) cm ON c.id = cm.company_id;