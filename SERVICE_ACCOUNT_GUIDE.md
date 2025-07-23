# 🔐 Google Service Account Setup Guide

## Why Service Accounts?

Service accounts are **robot accounts** that belong to your application, not to individual users. They're perfect for server-to-server communication.

## 📋 Complete Setup Process

### Step 1: Create Google Cloud Project

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create a new project** (or select existing):
   - Click "Select a project" → "New Project"
   - Name: `ibex35-dashboard` (or your choice)
   - Click "Create"

### Step 2: Enable Google Sheets API

1. **Navigate to APIs & Services** → **Library**
2. **Search for "Google Sheets API"**
3. **Click on it** and press **"Enable"**
4. **Wait for activation** (takes ~30 seconds)

### Step 3: Create Service Account

1. **Go to IAM & Admin** → **Service Accounts**
2. **Click "Create Service Account"**
3. **Fill in details**:
   ```
   Service account name: ibex35-sheets-reader
   Service account ID: ibex35-sheets-reader (auto-generated)
   Description: Service account for reading IBEX 35 data from Google Sheets
   ```
4. **Click "Create and Continue"**

### Step 4: Set Permissions (Optional)

1. **Skip the "Grant access" step** (we'll do this at sheet level)
2. **Click "Continue"** → **"Done"**

### Step 5: Generate Key File

1. **Find your service account** in the list
2. **Click on the service account email**
3. **Go to "Keys" tab**
4. **Click "Add Key"** → **"Create new key"**
5. **Select "JSON"** format
6. **Click "Create"**
7. **Save the downloaded JSON file** securely

### Step 6: Share Your Google Sheet

1. **Open your Google Sheet** with the IBEX 35 data
2. **Click "Share"** button (top right)
3. **Add the service account email** (from the JSON file):
   ```
   Example: ibex35-sheets-reader@your-project.iam.gserviceaccount.com
   ```
4. **Set permission to "Viewer"**
5. **Uncheck "Notify people"** (it's a robot account)
6. **Click "Share"**

## 🔧 JSON File Structure

Your downloaded JSON file looks like this:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "key-id",
  "private_key": "-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n",
  "client_email": "ibex35-sheets-reader@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

## 🔒 Configure Cloudflare Environment Variables

### Extract from JSON file:

1. **GOOGLE_SERVICE_ACCOUNT_EMAIL**: 
   ```
   Copy the "client_email" value
   Example: ibex35-sheets-reader@your-project.iam.gserviceaccount.com
   ```

2. **GOOGLE_PRIVATE_KEY**:
   ```bash
   # Base64 encode the private_key value:
   echo "-----BEGIN PRIVATE KEY-----\nYour-Private-Key-Here\n-----END PRIVATE KEY-----\n" | base64
   ```
   Copy the base64 output

3. **GOOGLE_SHEET_ID**:
   ```
   From your Google Sheets URL:
   https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit
   ```

### Add to Cloudflare Pages:

1. **Go to Cloudflare Pages Dashboard**
2. **Select your project** → **Settings** → **Environment Variables**
3. **Add these variables**:

   **Production Environment:**
   ```
   GOOGLE_SERVICE_ACCOUNT_EMAIL = ibex35-sheets-reader@your-project.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY = LS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0t... (base64 encoded)
   GOOGLE_SHEET_ID = 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms
   ```

   **Preview Environment:**
   ```
   (Same values as production)
   ```

4. **Click "Save"**

## ✅ Test Your Setup

### Method 1: Test API Endpoint
```bash
curl https://your-app.pages.dev/api/sheets-service
```

### Method 2: Check Browser Console
1. **Open your dashboard**
2. **Open browser dev tools** (F12)
3. **Look for these messages**:
   ```
   🔒 Fetching data from secure backend...
   ✅ Successfully loaded X companies from secure backend
   📊 Last updated: [timestamp]
   ```

### Method 3: Verify Sheet Access
1. **Check your Google Sheet's sharing settings**
2. **Confirm the service account email is listed**
3. **Make sure it has "Viewer" permission**

## 🔍 Troubleshooting

### Common Issues:

**"Missing service account credentials"**
- ✅ Check environment variables are set in Cloudflare
- ✅ Verify variable names match exactly

**"Failed to get service account token"**
- ✅ Verify private key is properly base64 encoded
- ✅ Check for extra spaces or newlines in the key
- ✅ Ensure Google Sheets API is enabled

**"Google Sheets API error: 403"**
- ✅ Service account email must have access to the sheet
- ✅ Sheet must be shared with the service account
- ✅ Check the service account has "Viewer" permission

**"Google Sheets API error: 404"**
- ✅ Verify the Google Sheet ID is correct
- ✅ Make sure the sheet is not deleted or moved

### Debug Steps:

1. **Test Google Sheets API access**:
   ```bash
   # Test with curl (replace with your details)
   curl -H "Authorization: Bearer $(gcloud auth print-access-token)" \
        "https://sheets.googleapis.com/v4/spreadsheets/YOUR_SHEET_ID/values/Sheet1!A1:G10"
   ```

2. **Check Cloudflare Functions logs**:
   - Cloudflare Pages → Functions → View logs
   - Look for authentication errors

3. **Verify JSON file integrity**:
   - Make sure the downloaded JSON is valid
   - Check that base64 encoding didn't introduce errors

## 🚀 Advanced Security Tips

### 1. Principle of Least Privilege
- Only share specific sheets, not entire Google Drive
- Use "Viewer" permission, never "Editor" unless needed

### 2. Key Rotation
- Periodically generate new service account keys
- Delete old keys after updating environment variables

### 3. Monitoring
- Monitor service account usage in Google Cloud Console
- Set up alerts for unusual API usage

### 4. Backup Access
- Keep multiple service accounts for critical applications
- Document all service account configurations

## 📞 Support

If you encounter issues:

1. **Check the browser console** for detailed error messages
2. **Verify your Google Sheet format** matches expected columns
3. **Test the API endpoint directly** with curl
4. **Check Cloudflare Functions logs** for backend errors
5. **Ensure Google Sheets API is enabled** in your project

Your service account setup provides enterprise-grade security for your IBEX 35 dashboard! 🏆🔒