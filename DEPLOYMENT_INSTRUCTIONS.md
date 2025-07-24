# Deployment Instructions for New Financial Columns

This document outlines the steps needed to deploy the new financial columns to your IBEX 35 dashboard.

## What Was Updated

### 1. Database Schema
- **File**: `schema.sql` 
- **New columns added**: `price_change`, `eps`, `high_52`, `low_52`
- **Migration file**: `migration_add_financial_columns.sql`

### 2. Cloudflare Worker
- **Files**: `worker/src/index.js`, `worker/src/database.js`
- **Updated**: Google Sheets fetch range from A2:G to A2:L (12 columns)
- **Added**: Mapping for new financial metrics from Google Sheets to database

### 3. Frontend Components
- **File**: `src/services/secureGoogleSheetsService.ts`
- **Updated**: Data interface and transformation logic
- **File**: `src/components/StyledDashboard.tsx`
- **Added**: New financial metrics display (P/E, EPS, 52W High/Low)

### 4. TypeScript Types
- **File**: `src/types/index.ts`
- **Added**: New optional properties for financial metrics

## Deployment Steps

### Step 1: Update D1 Database Schema
```bash
# Run the migration SQL against your D1 database
wrangler d1 execute ibex35-intelligence --file=migration_add_financial_columns.sql
```

### Step 2: Deploy Cloudflare Worker
```bash
cd worker
wrangler deploy
```

### Step 3: Deploy Frontend 
```bash
# Build and deploy your frontend (assuming using Cloudflare Pages)
npm run build
# Deploy via your preferred method
```

### Step 4: Verify Data Flow
1. Check that your Google Sheets has the correct column order:
   - A: Company
   - B: Sector  
   - C: Formatted_Ticker
   - D: Current_Price_EUR
   - E: MarketCap_EUR
   - F: Volume_EUR
   - G: P/E
   - H: EPS
   - I: High52
   - J: Low52
   - K: Price_Change
   - L: Price_Change_%

2. Trigger a manual sync:
```bash
curl -X POST https://ibex35-sheets-api.anurnberg.workers.dev/api/sync
```

3. Verify the frontend displays the new metrics

## Current Caching Configuration

✅ **Hourly refresh is already implemented**:
- **Cron job**: `0 * * * *` (every hour)
- **Data flow**: Google Sheets → Cloudflare Worker → D1 Database → Frontend
- **Caching layers**: 
  - D1 Database (persistent cache)
  - HTTP cache (1-5 minutes)
  - Client cache (1 minute)

## New Financial Metrics Added

| Metric | Display Name | Color | Icon |
|--------|-------------|-------|------|
| peRatio | P/E Ratio | Green | TrendingUp |
| eps | EPS | Amber | DollarSign |
| high52 | 52W High | Red | ArrowUp |
| low52 | 52W Low | Indigo | ArrowDown |
| changePercent | Change % | Pink | Percent |
| priceChange | Price Change | Cyan | DollarSign |

## Troubleshooting

### Issue: New columns show "N/A"
- Verify Google Sheets has data in columns G-L
- Check worker logs for sync errors
- Manually trigger sync via API

### Issue: Worker deployment fails
- Verify `wrangler.toml` configuration
- Check D1 database binding is correct
- Ensure Google service account credentials are set

### Issue: Frontend build errors
- Run `npm run build` to check for TypeScript errors
- Verify all imports are correct
- Check browser console for runtime errors

## Verification Checklist

- [ ] D1 database has new columns
- [ ] Worker successfully fetches 12 columns from Google Sheets
- [ ] Frontend displays 6 financial metrics per company card
- [ ] Hourly sync continues to work
- [ ] All financial metrics format correctly (€ for prices, N/A for missing data)
- [ ] Company cards display properly with new 2x3 metric grid

## Next Steps

After successful deployment, you mentioned wanting to add historical data. This would involve:
1. New database tables for time-series data
2. Additional Google Sheets or data sources
3. Enhanced frontend visualization components

The current architecture supports these future enhancements well.