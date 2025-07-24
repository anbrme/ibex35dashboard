# Troubleshooting Sync Issues

## Current Problem
The sync endpoint is failing with "D1_ERROR: No SQL statements detected" which means no data is being fetched from Google Sheets or the data transformation is failing.

## Quick Diagnostics

### Step 1: Check Your Google Sheets Structure
Make sure your Google Sheet has exactly this column structure in **Sheet1**:

| Column | Header | Example Data |
|--------|--------|--------------|
| A | Company | Banco Santander |
| B | Sector | Financial Services |
| C | Formatted_Ticker | SAN |
| D | Current_Price_EUR | 7.58 |
| E | MarketCap_EUR | 129962976403 |
| F | Volume_EUR | 26668228 |
| G | P/E | 15.2 |
| H | EPS | 0.75 |
| I | High52 | 8.45 |
| J | Low52 | 6.23 |
| K | Price_Change | 0.12 |
| L | Price_Change_% | 1.6 |

### Step 2: Verify Sheet Access
1. Your Google Sheet ID is: `11rpmdk6jWqwueio-aTJYoFBiNCmlnLhZ7jHPbvPrEJ0`
2. Service account must have **Editor** or **Viewer** access to this sheet
3. Make sure the sheet is not empty and has data starting from row 2

### Step 3: Manual Sync Test
Try the manual sync again after verifying the sheet structure:
```bash
curl -X POST https://ibex35-sheets-api.anurnberg.workers.dev/api/sync
```

### Step 4: Check Worker Logs
If you have access to Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your worker (`ibex35-sheets-api`)
3. Check the **Logs** tab for detailed error messages

## Common Issues & Solutions

### Issue: "No SQL statements detected"
**Cause**: Google Sheets data is not being fetched or is empty
**Solutions**:
- Verify Google Sheets has data in columns A-L starting from row 2
- Check service account has access to the sheet
- Ensure sheet is not private or restricted

### Issue: Authentication errors
**Cause**: Service account credentials are incorrect or expired
**Solutions**:
- Regenerate service account key
- Re-set the secrets: `wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL` and `wrangler secret put GOOGLE_PRIVATE_KEY`

### Issue: Wrong column mapping
**Cause**: Google Sheets columns don't match expected structure
**Solutions**:
- Make sure column order exactly matches the table above
- Check that numeric columns contain valid numbers (not text)
- Remove any empty rows between header and data

## Test Data Structure
If you want to test with minimal data, create a Google Sheet with just these 2 rows:

**Row 1 (Headers):**
Company | Sector | Formatted_Ticker | Current_Price_EUR | MarketCap_EUR | Volume_EUR | P/E | EPS | High52 | Low52 | Price_Change | Price_Change_%

**Row 2 (Sample Data):**
Banco Santander | Financial Services | SAN | 7.58 | 129962976403 | 26668228 | 15.2 | 0.75 | 8.45 | 6.23 | 0.12 | 1.6

## Next Steps
Once sync works, the frontend will automatically display the new financial metrics:
- P/E Ratio, EPS, 52W High/Low, Price Change, Change %
- All metrics will be properly formatted with EUR symbols and percentages
- Company cards will show all 8 financial data points

## Need Help?
If sync still fails after checking the above, the issue might be:
1. Google Sheets API rate limiting
2. Service account permissions
3. Sheet structure mismatch

The hourly cron job will continue to retry automatically once the issue is resolved.