# 🚀 Quick OAuth2 Setup Guide

Since you already have Google Client ID and Secret, this guide helps you get your dashboard working quickly using OAuth2.

## ⚡ Quick Setup (5 minutes)

### Step 1: Generate Refresh Token

1. **Go to Google OAuth2 Playground**: https://developers.google.com/oauthplayground/

2. **Configure OAuth2 Settings** (click ⚙️ in top right):
   - ✅ Check "Use your own OAuth credentials"
   - **OAuth Client ID**: `your_google_client_id`
   - **OAuth Client secret**: `your_google_client_secret`

3. **Select Scope**:
   - In "Step 1", add this scope: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Click **"Authorize APIs"**

4. **Authorize**:
   - Login with your Google account
   - Allow access to Google Sheets
   - You'll be redirected back to the playground

5. **Get Refresh Token**:
   - Click **"Exchange authorization code for tokens"**
   - Copy the **"Refresh token"** value (starts with `1//`)

### Step 2: Configure Environment Variables

1. **Go to Cloudflare Pages Dashboard**:
   - https://dash.cloudflare.com/
   - Pages → **ibex35dashboard** → Settings → Environment Variables

2. **Add These Variables** (Production):
   ```
   GOOGLE_CLIENT_ID = your_google_client_id
   GOOGLE_CLIENT_SECRET = your_google_client_secret
   GOOGLE_REFRESH_TOKEN = 1//04...your_refresh_token_here
   GOOGLE_SHEET_ID = your_google_sheet_id_from_url
   ```

3. **Get Your Google Sheet ID**:
   - From your Google Sheets URL: `https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit`
   - Copy the SHEET_ID part

4. **Click "Save"**

### Step 3: Deploy and Test

1. **Deploy the update**:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name ibex35dashboard
   ```

2. **Test the API endpoint**:
   - Visit: `https://your-app.pages.dev/api/sheets-oauth`
   - You should see your Google Sheets data in JSON format

3. **Check your dashboard**:
   - Visit: `https://your-app.pages.dev`
   - Your real IBEX 35 data should now load!

## 🔍 Troubleshooting

### "Missing OAuth2 configuration" Error
- ✅ Verify all 4 environment variables are set in Cloudflare
- ✅ Check variable names match exactly (case-sensitive)
- ✅ Make sure there are no extra spaces

### "Missing GOOGLE_REFRESH_TOKEN" Error  
- ✅ Generate refresh token using OAuth Playground
- ✅ Make sure you used your own credentials in playground settings
- ✅ Copy the complete refresh token (starts with `1//`)

### "Token refresh failed" Error
- ✅ Verify Client ID and Secret are correct
- ✅ Check that OAuth consent screen is configured
- ✅ Ensure refresh token was generated correctly

### "Google Sheets API error: 403" Error
- ✅ Enable Google Sheets API in Google Cloud Console
- ✅ Make sure your Google account has access to the sheet
- ✅ Verify the Sheet ID is correct

### "Google Sheets API error: 404" Error
- ✅ Check the Google Sheet ID in the URL
- ✅ Ensure the sheet exists and is not deleted
- ✅ Verify you have access to the sheet

## 📊 Google Sheets Format

Make sure your sheet has this exact format:

| Column A | Column B | Column C | Column D | Column E | Column F | Column G |
|----------|----------|----------|----------|----------|----------|----------|
| Ticker | Company | Sector | Formatted_Ticker | Current_Price_EUR | MarketCap_EUR | Volume_EUR |
| SAN.MC | Banco Santander | Financials | SAN | 4.234 | 65240000000 | 45230000 |
| IBE.MC | Iberdrola | Utilities | IBE | 12.845 | 81340000000 | 28450000 |

## 🚀 Next Steps

Once working, you can optionally upgrade to Service Account authentication for better security:
- Follow the [SERVICE_ACCOUNT_GUIDE.md](SERVICE_ACCOUNT_GUIDE.md)
- Service accounts don't require user interaction
- No refresh token management needed
- Better for production environments

## 🔗 Useful Links

- **OAuth2 Playground**: https://developers.google.com/oauthplayground/
- **Google Cloud Console**: https://console.cloud.google.com/
- **Cloudflare Pages**: https://dash.cloudflare.com/
- **Your Repository**: https://github.com/anbrme/ibex35dashboard

Your dashboard should be working with real data in just a few minutes! 🎉