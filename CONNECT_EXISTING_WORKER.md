# 🔗 Connect Your Existing Cloudflare Worker

You already have a Cloudflare Worker (`ibex35-api`) with service account integration. Here's how to connect it to your dashboard.

## 🔍 Step 1: Find Your Worker URL

1. **Go to Cloudflare Workers Dashboard**:
   - https://dash.cloudflare.com/e0f6d4652827b154cc920fd53ed54101/workers/services/view/ibex35-api/production

2. **Check the "Triggers" section** or **"Routes"** to find your Worker URL. It should be something like:
   - `https://ibex35-api.your-subdomain.workers.dev`
   - Or a custom domain you've configured

3. **Test your Worker** by visiting the URL in your browser. You should see your IBEX 35 data in JSON format.

## 🔧 Step 2: Configure the Dashboard

### Option A: Environment Variable (Recommended)

1. **Add to Cloudflare Pages Environment Variables**:
   - Pages → ibex35dashboard → Settings → Environment Variables
   - Add: `VITE_API_URL = https://your-worker-url.workers.dev`

### Option B: Direct Configuration

Update the API URL in the code:

```typescript
// src/services/secureGoogleSheetsService.ts
private static readonly API_BASE_URL = 'https://your-actual-worker-url.workers.dev';
```

## 🧪 Step 3: Test the Connection

1. **Build and deploy**:
   ```bash
   npm run build
   wrangler pages deploy dist --project-name ibex35dashboard
   ```

2. **Test the connection**:
   - Open browser console on your dashboard
   - Look for: `🔒 Fetching data from secure backend...`
   - Should show: `✅ Successfully loaded X companies from secure backend`

## 🔍 Troubleshooting

### Find Your Worker URL

If you can't find the URL, check these locations in Cloudflare Dashboard:

1. **Workers → ibex35-api → Triggers**
2. **Workers → ibex35-api → Settings → Triggers**
3. **Workers → ibex35-api → Quick edit → Preview tab**

### Common Worker URL Patterns

- `https://ibex35-api.your-subdomain.workers.dev`
- `https://your-custom-domain.com/api`
- `https://api.your-domain.com`

### Test Your Worker Directly

```bash
# Replace with your actual Worker URL
curl https://your-worker-url.workers.dev

# Expected response:
{
  "success": true,
  "data": [
    {
      "ticker": "SAN.MC",
      "company": "Banco Santander",
      "sector": "Financials",
      ...
    }
  ],
  "count": 35
}
```

## 📊 Expected Worker Response Format

Your Worker should return data in this format:

```json
{
  "success": true,
  "data": [
    {
      "ticker": "SAN.MC",
      "company": "Banco Santander",
      "sector": "Financials",
      "formattedTicker": "SAN",
      "currentPriceEur": 4.234,
      "marketCapEur": 65240000000,
      "volumeEur": 45230000
    }
  ],
  "count": 35,
  "lastUpdated": "2025-07-23T12:00:00.000Z"
}
```

## 🔒 CORS Configuration

Make sure your Worker includes CORS headers:

```javascript
// In your Worker
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

## 🚀 Quick Fix

If you want to quickly test with a working URL, you can temporarily use:

```typescript
// Temporary fallback to mock data endpoint
private static readonly API_BASE_URL = window.location.origin + '/api/mock';
```

This will use the mock data until you configure your Worker URL.

## 📞 Help

Once you find your Worker URL, either:
1. **Set the environment variable** `VITE_API_URL` in Cloudflare Pages
2. **Or tell me the URL** and I'll update the code directly

Your dashboard should connect to your real Google Sheets data immediately! 🎉