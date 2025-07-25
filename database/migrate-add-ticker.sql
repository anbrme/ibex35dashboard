-- Migration to add ticker column to company_shareholders table
-- Run this on your D1 database to add the missing ticker column

ALTER TABLE company_shareholders ADD COLUMN ticker VARCHAR(20);

-- Create index for ticker for performance
CREATE INDEX IF NOT EXISTS idx_company_shareholders_ticker ON company_shareholders(ticker);

-- Optional: Update existing records to populate ticker from companies table
-- Uncomment the following if you have existing shareholders data to migrate:
-- UPDATE company_shareholders 
-- SET ticker = (
--     SELECT symbol 
--     FROM companies 
--     WHERE companies.id = company_shareholders.company_id
-- )
-- WHERE ticker IS NULL;