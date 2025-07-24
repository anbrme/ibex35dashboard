-- Migration to add new financial data columns to companies table
-- Run this against your D1 database to add the missing columns

-- Add price_change column (absolute price change)
ALTER TABLE companies ADD COLUMN price_change REAL;

-- Add eps column (Earnings Per Share)
ALTER TABLE companies ADD COLUMN eps REAL;

-- Add high_52 column (52-week high)
ALTER TABLE companies ADD COLUMN high_52 REAL;

-- Add low_52 column (52-week low)
ALTER TABLE companies ADD COLUMN low_52 REAL;

-- Optional: Add comment for documentation
-- These columns correspond to the new Google Sheets columns:
-- price_change = Price_Change
-- eps = EPS  
-- high_52 = High52
-- low_52 = Low52