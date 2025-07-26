-- Migration to enhance news_items table with all required fields
-- Run this on your D1 database to update the schema

-- Add missing columns to news_items table
ALTER TABLE news_items ADD COLUMN content TEXT;
ALTER TABLE news_items ADD COLUMN author TEXT;
ALTER TABLE news_items ADD COLUMN sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral'));
ALTER TABLE news_items ADD COLUMN tags TEXT; -- JSON array of tags
ALTER TABLE news_items ADD COLUMN language TEXT DEFAULT 'es';
ALTER TABLE news_items ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP;

-- Update sentiment_score to sentiment (keeping both for compatibility)
-- The new sentiment column will be 'positive'/'negative'/'neutral'
-- The sentiment_score column remains for numerical analysis (-1 to 1)

-- Add index for sentiment analysis over time
CREATE INDEX IF NOT EXISTS idx_news_sentiment_date ON news_items(sentiment, published_at);

-- Add index for tags (for topic analysis)
CREATE INDEX IF NOT EXISTS idx_news_tags ON news_items(tags);

-- Add index for language
CREATE INDEX IF NOT EXISTS idx_news_language ON news_items(language);