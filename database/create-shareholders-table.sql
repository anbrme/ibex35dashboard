-- Create company_shareholders table with ticker column
CREATE TABLE company_shareholders (
    id VARCHAR(36) PRIMARY KEY,
    company_id VARCHAR(36) NOT NULL,
    ticker VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('individual', 'institutional', 'government', 'insider', 'other')),
    percentage DECIMAL(5,2) NOT NULL,
    shares BIGINT NOT NULL,
    report_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_company_shareholders_company ON company_shareholders(company_id);
CREATE INDEX idx_company_shareholders_ticker ON company_shareholders(ticker);