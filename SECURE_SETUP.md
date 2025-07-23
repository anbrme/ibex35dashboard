# 🔒 Secure Google Sheets Integration Setup

This guide helps you securely connect your Google Sheets data without exposing credentials in the browser.

## 🛡️ Security Approach

Your Google Client ID and Secret are stored securely in Cloudflare Workers (server-side), not in the frontend JavaScript where they could be exposed.

## 📋 Setup Steps

### Step 1: Prepare Your Google Sheets

1. **Ensure your Google Sheet has the correct format**:
   ```
   Column A: Ticker (e.g., SAN.MC)
   Column B: Company (e.g., Banco Santander)
   Column C: Sector (e.g., Financials)
   Column D: Formatted_Ticker (e.g., SAN)
   Column E: Current_Price_EUR (e.g., 4.234)
   Column F: MarketCap_EUR (e.g., 65240000000)
   Column G: Volume_EUR (e.g., 45230000)
   ```

2. **Get your Google Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

### Step 2: Configure Environment Variables in Cloudflare

1. **Go to Cloudflare Pages Dashboard**:
   - Navigate to your `ibex35dashboard` project
   - Go to **Settings** → **Environment Variables**

2. **Add these secure environment variables**:

   **For OAuth2 Flow:**
   ```
   GOOGLE_CLIENT_ID = your_google_client_id
   GOOGLE_CLIENT_SECRET = your_google_client_secret
   GOOGLE_REFRESH_TOKEN = your_refresh_token (see below)
   GOOGLE_SHEET_ID = your_google_sheet_id
   ```

   **Alternative: For Service Account (Recommended):**
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL = your-service-account@project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY = base64_encoded_private_key
   GOOGLE_SHEET_ID = your_google_sheet_id
   ```

### Step 3: Generate Refresh Token (if using OAuth2)

If you're using the OAuth2 flow, you need a refresh token:

1. **Use Google OAuth2 Playground**:
   - Go to https://developers.google.com/oauthplayground/
   - In settings (⚙️), check "Use your own OAuth credentials"
   - Enter your Client ID and Client Secret
   - In Step 1, add scope: `https://www.googleapis.com/auth/spreadsheets.readonly`
   - Authorize and get the refresh token

2. **Add the refresh token** to your Cloudflare environment variables

### Step 4: Alternative - Service Account Setup (Recommended)

This is more secure as it doesn't require OAuth flows:

1. **Create a Service Account**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google Sheets API
   - Go to **IAM & Admin** → **Service Accounts**
   - Create a new service account
   - Download the JSON key file

2. **Share your Google Sheet**:
   - Share your Google Sheet with the service account email
   - Give it "Viewer" permissions

3. **Configure Cloudflare Variables**:
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL = [email from JSON file]
   GOOGLE_PRIVATE_KEY = [base64 encode the private_key from JSON]
   GOOGLE_SHEET_ID = [your sheet ID]
   ```

### Step 5: Test the Setup

1. **Deploy your changes**:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name ibex35dashboard
   ```

2. **Test the API endpoint**:
   - Visit: `https://your-app.pages.dev/api/sheets`
   - You should see your Google Sheets data in JSON format

3. **Check the dashboard**:
   - The app should now load your real IBEX 35 data
   - Look in browser console for connection status

## 🔧 Troubleshooting

### Common Issues:

1. **"Missing Google credentials" error**:
   - Verify environment variables are set in Cloudflare Pages
   - Check variable names match exactly

2. **"Failed to get access token" error**:
   - Verify your Client ID and Secret are correct
   - For service accounts, check the private key is properly base64 encoded

3. **"Failed to fetch from Google Sheets" error**:
   - Verify the Sheet ID is correct
   - Ensure the service account has access to the sheet
   - Check that Google Sheets API is enabled

4. **CORS errors**:
   - The Cloudflare Workers function handles CORS automatically
   - If you see CORS errors, there might be a configuration issue

### Debug Steps:

1. **Check Cloudflare Functions logs**:
   - Go to Cloudflare Pages → Functions → View logs
   - Look for error messages from your API calls

2. **Test API directly**:
   ```bash
   curl https://your-app.pages.dev/api/sheets
   ```

3. **Browser Console**:
   - Check for detailed error messages
   - Look for network requests to `/api/sheets`

## 🚀 Production Checklist

- [ ] Environment variables configured in Cloudflare
- [ ] Google Sheets API enabled
- [ ] Service account has sheet access
- [ ] API endpoint returns data successfully
- [ ] Dashboard loads real data
- [ ] No credentials visible in browser dev tools

## 📞 Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify your Google Sheet format matches the expected columns
3. Test the API endpoint directly
4. Check Cloudflare Functions logs for backend errors

Your credentials are now secure and never exposed to the browser! 🔒✨