// Dedicated Cloudflare Worker for IBEX 35 with D1 Database
// More reliable than Pages Functions with database caching

import { DatabaseService } from './database.js';

export default {
  // Handle HTTP requests
  async fetch(request, env) {
    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Accept, Pragma, Expires',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    // Initialize database service
    const db = new DatabaseService(env.DB);
    const url = new URL(request.url);
    const path = url.pathname;

    // Route handling
    if (path === '/api/companies') {
      return handleGetCompanies(db, request);
    } else if (path === '/api/sync') {
      return handleDataSync(db, env, request);
    } else if (path === '/api/news') {
      return handleNewsOperations(db, request);
    } else if (path === '/api/news/analytics') {
      return handleNewsAnalytics(db, request);
    } else if (path === '/api/network') {
      return handleNetworkData(db, request);
    } else if (path === '/api/status') {
      return handleSyncStatus(db);
    } else if (path === '/api/debug') {
      return handleDebug(env);
    } else if (path === '/api/test-shareholders') {
      return handleTestShareholders(env);
    }

    // Default: return companies (backward compatibility)
    if (request.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    try {
      console.log('🚀 Getting IBEX 35 data from D1...');
      const companies = await db.getAllCompaniesWithDirectors();
      
      return new Response(JSON.stringify({
        success: true,
        data: companies,
        count: companies.length,
        lastUpdated: new Date().toISOString(),
        source: 'd1-database'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60, s-max-age=60', // 1-minute cache
        }
      });

    } catch (error) {
      console.error('💥 Database error:', error.message);
      return createErrorResponse(`Database error: ${error.message}`, 500);
    }
  },

  // Handle scheduled events (cron)
  async scheduled(event, env, ctx) {
    console.log('🕐 Starting scheduled data sync...');
    
    try {
      const db = new DatabaseService(env.DB);
      
      // Fetch fresh data from Google Sheets
      const companiesData = await fetchFromGoogleSheets(env);
      
      // Debug: Check if companies have shareholders data
      const companiesWithShareholders = companiesData.filter(c => c.shareholders && c.shareholders.length > 0);
      console.log(`📊 Scheduled sync - Companies with shareholders data: ${companiesWithShareholders.length}/${companiesData.length}`);
      
      // Sync to D1
      const companiesResult = await db.syncCompaniesData(companiesData);
      const directorsResult = await db.syncDirectorsData(companiesData);
      const shareholdersResult = await db.syncShareholdersData(companiesData);
      
      // Log sync operation
      await db.logSyncOperation('scheduled_sync', companiesData.length, 'completed');
      
      console.log('✅ Scheduled sync completed:', {
        companies: companiesResult.recordsProcessed,
        directors: directorsResult.peopleProcessed,
        shareholders: shareholdersResult?.shareholdersProcessed || 0
      });

      // Optional: Send notification or log to external service
      if (env.SLACK_WEBHOOK_URL) {
        await fetch(env.SLACK_WEBHOOK_URL, {
          method: 'POST',  
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `IBEX 35 Scheduled Sync Complete: ${companiesResult.recordsProcessed} companies, ${directorsResult.peopleProcessed} directors, ${shareholdersResult.shareholdersProcessed} shareholders`
          })
        });
      }

    } catch (error) {
      console.error('💥 Scheduled sync failed:', error);
      
      const db = new DatabaseService(env.DB);
      await db.logSyncOperation('scheduled_sync', 0, 'failed', error.message);
      
      // Send error notification
      if (env.SLACK_WEBHOOK_URL) {
        await fetch(env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `❌ IBEX 35 Scheduled Sync Failed: ${error.message}`
          })
        });
      }
    }
  }
};

// Handle /api/companies endpoint
async function handleGetCompanies(db, request) {
  try {
    const companies = await db.getAllCompaniesWithDirectors();
    
    return new Response(JSON.stringify({
      success: true,
      data: companies,
      count: companies.length,
      lastUpdated: new Date().toISOString(),
      source: 'd1-database'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60, s-max-age=60',
      }
    });
  } catch (error) {
    return createErrorResponse(`Database error: ${error.message}`, 500);
  }
}

// Handle /api/sync endpoint - sync from Google Sheets to D1
async function handleDataSync(db, env, request) {
  if (request.method !== 'POST') {
    return createErrorResponse('Sync endpoint requires POST method', 405);
  }

  try {
    console.log('🔄 Starting data sync from Google Sheets to D1...');
    
    // Fetch fresh data from Google Sheets
    const companiesData = await fetchFromGoogleSheets(env);
    
    // Debug: Check if companies have shareholders data
    const companiesWithShareholders = companiesData.filter(c => c.shareholders && c.shareholders.length > 0);
    console.log(`📊 Companies with shareholders data: ${companiesWithShareholders.length}/${companiesData.length}`);
    if (companiesWithShareholders.length > 0) {
      console.log(`📊 First company with shareholders:`, companiesWithShareholders[0].company, companiesWithShareholders[0].shareholders.length, 'shareholders');
    }
    
    // Sync to D1
    const companiesResult = await db.syncCompaniesData(companiesData);
    const directorsResult = await db.syncDirectorsData(companiesData);
    
    let shareholdersResult;
    try {
      shareholdersResult = await db.syncShareholdersData(companiesData);
      console.log('📊 Shareholders sync result:', shareholdersResult);
    } catch (error) {
      console.error('❌ Shareholders sync error:', error);
      shareholdersResult = { error: error.message, shareholdersProcessed: 0 };
    }
    
    // Log sync operation
    await db.logSyncOperation('full_sync', companiesData.length, 'completed');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Data sync completed',
      results: {
        companies: companiesResult,
        directors: directorsResult,
        shareholders: shareholdersResult
      },
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    console.error('💥 Sync error:', error.message);
    await db.logSyncOperation('full_sync', 0, 'failed', error.message);
    return createErrorResponse(`Sync failed: ${error.message}`, 500);
  }
}

// Handle /api/network endpoint
async function handleNetworkData(db, request) {
  try {
    const url = new URL(request.url);
    const tickers = url.searchParams.get('tickers');
    const selectedTickers = tickers ? tickers.split(',') : [];
    
    const networkData = await db.getNetworkData(selectedTickers);
    
    return new Response(JSON.stringify({
      success: true,
      data: networkData,
      selectedTickers,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300, s-max-age=300',
      }
    });
  } catch (error) {
    return createErrorResponse(`Network data error: ${error.message}`, 500);
  }
}

// Handle /api/debug endpoint - test Google Sheets access
async function handleDebug(env) {
  try {
    console.log('🐛 Debug: Testing Google Sheets access...');
    
    // Check environment variables
    const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY;
    const SHEET_ID = env.GOOGLE_SHEET_ID;
    
    const envCheck = {
      hasServiceAccountEmail: !!SERVICE_ACCOUNT_EMAIL,
      hasPrivateKey: !!PRIVATE_KEY,
      hasSheetId: !!SHEET_ID,
      sheetId: SHEET_ID
    };
    
    console.log('🔍 Environment check:', envCheck);
    
    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
      return createErrorResponse('Missing environment variables', 500, envCheck);
    }
    
    // Try to create JWT and get access token
    const jwt = await createServiceAccountJWT(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY);
    const accessToken = await getAccessToken(jwt);
    
    // Try to fetch a larger range to see the actual structure
    console.log('📊 Testing larger range fetch...');
    const testData = await fetchGoogleSheetsData(SHEET_ID, accessToken, 'Sheet1!A1:L3');
    
    // Also test Shareholders sheet access with multiple attempts
    console.log('📊 Testing Shareholders sheet access...');
    const shareholdersTests = [];
    const testRanges = [
      'Shareholders!A1:D',
      'Shareholders!A2:D', 
      'Sheet3!A1:D5',
      'Sheet3!A2:D5'
    ];
    
    for (const range of testRanges) {
      try {
        const data = await fetchGoogleSheetsData(SHEET_ID, accessToken, range);
        shareholdersTests.push({
          range,
          success: true,
          rows: data.values?.length || 0,
          sampleData: data.values?.slice(0, 2)
        });
        console.log(`✅ ${range}: ${data.values?.length || 0} rows`);
      } catch (error) {
        shareholdersTests.push({
          range,
          success: false,
          error: error.message
        });
        console.log(`❌ ${range}: ${error.message}`);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      debug: {
        environment: envCheck,
        testData: testData.values || [],
        shareholdersTests: shareholdersTests,
        message: 'Google Sheets access working'
      },
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
    
  } catch (error) {
    console.error('🐛 Debug error:', error);
    return createErrorResponse(`Debug failed: ${error.message}`, 500);
  }
}

// Handle /api/test-shareholders endpoint - dedicated shareholders testing
async function handleTestShareholders(env) {
  try {
    console.log('🔍 Testing shareholders sheet access...');
    
    const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY;
    const SHEET_ID = env.GOOGLE_SHEET_ID;
    
    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
      return createErrorResponse('Missing environment variables', 500);
    }
    
    const jwt = await createServiceAccountJWT(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY);
    const accessToken = await getAccessToken(jwt);
    
    const testResults = [];
    const attemptRanges = [
      'Shareholders!A1:D',
      'Shareholders!A2:D', 
      'Sheet3!A1:D',
      'Sheet3!A2:D',
      'Shareholders!A:D',
      'Sheet3!A:D'
    ];
    
    for (const range of attemptRanges) {
      try {
        console.log(`🔍 Testing range: ${range}`);
        const data = await fetchGoogleSheetsData(SHEET_ID, accessToken, range);
        testResults.push({
          range,
          success: true,
          rows: data.values?.length || 0,
          data: data.values?.slice(0, 3) || [] // First 3 rows only
        });
        console.log(`✅ Success with ${range}: ${data.values?.length || 0} rows`);
        break; // Stop at first success
      } catch (error) {
        testResults.push({
          range,
          success: false,
          error: error.message
        });
        console.log(`❌ Failed with ${range}: ${error.message}`);
      }
    }
    
    return new Response(JSON.stringify({
      success: true,
      testResults,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
    
  } catch (error) {
    console.error('🐛 Test shareholders error:', error);
    return createErrorResponse(`Test failed: ${error.message}`, 500);
  }
}

// Handle /api/status endpoint
async function handleSyncStatus(db) {
  try {
    const syncStatus = await db.getLatestSyncStatus();
    
    return new Response(JSON.stringify({
      success: true,
      syncStatus,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return createErrorResponse(`Status error: ${error.message}`, 500);
  }
}

// Fetch data from Google Sheets (original logic)
async function fetchFromGoogleSheets(env) {
  try {
    console.log('🚀 Starting fresh Google Sheets fetch...');
        
    // Validate environment variables
    const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY;
    const SHEET_ID = env.GOOGLE_SHEET_ID;
    
    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SHEET_ID) {
      console.error('❌ Missing environment variables:', {
        hasEmail: !!SERVICE_ACCOUNT_EMAIL,
        hasKey: !!PRIVATE_KEY,
        hasSheetId: !!SHEET_ID
      });
      throw new Error('Server configuration error - missing credentials');
    }

    console.log(`🔐 Using service account: ${SERVICE_ACCOUNT_EMAIL}`);
    console.log(`📊 Sheet ID: ${SHEET_ID}`);
    
    // Create JWT for service account authentication
    const jwt = await createServiceAccountJWT(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY);
    console.log('✅ JWT created successfully');
    
    // Exchange JWT for access token
    const accessToken = await getAccessToken(jwt);
    console.log('✅ Access token obtained');
    
    // Fetch data from both sheets
    console.log('📋 Fetching companies from Sheet1...');
    // Fetch the full range with financial data
    console.log('🔍 Fetching full range A2:N (including ISIN in column N)...');
    const companiesData = await fetchGoogleSheetsData(SHEET_ID, accessToken, 'Sheet1!A2:N');
    
    console.log('👥 Fetching directors from Directors sheet...');
    let directorsData;
    
    // Try multiple approaches to access the Directors sheet (now with ISIN column)
    const directorsAttempts = [
      'Directors!A2:F',
      'Directors!A1:F', 
      'Directors!A:F',
      "'Directors'!A2:F",  // With quotes
      'Sheet2!A2:F'        // Try by position
    ];
    
    for (let i = 0; i < directorsAttempts.length; i++) {
      const range = directorsAttempts[i];
      try {
        console.log(`🔍 Attempting to fetch directors with range: ${range}`);
        directorsData = await fetchGoogleSheetsData(SHEET_ID, accessToken, range);
        console.log(`✅ Successfully fetched directors with range: ${range}`);
        break;
      } catch (error) {
        console.warn(`⚠️ Failed to fetch with range ${range}:`, error.message);
        if (i === directorsAttempts.length - 1) {
          console.error('❌ All attempts to fetch Directors sheet failed');
          directorsData = { values: [] };
        }
      }
    }
    
    console.log('📊 Fetching shareholders from Shareholders sheet...');
    let shareholdersData;
    
    // Try multiple approaches to access the Shareholders sheet (now with ISIN column)
    const shareholdersAttempts = [
      'Shareholders!A2:F',    // Skip header, include ISIN
      'Shareholders!A1:F',    // Include header, include ISIN
      'Shareholders!A:F',     // All rows, include ISIN
      "'Shareholders'!A2:F",  // With quotes
      'Sheet3!A2:F',          // Try by position
      'Sheet3!A1:F',          // Try by position with header
      'Shareholders!A2:Z',    // Wider range in case more columns
      'Sheet3!A2:Z'           // Wider range by position
    ];
    
    for (let i = 0; i < shareholdersAttempts.length; i++) {
      const range = shareholdersAttempts[i];
      try {
        console.log(`🔍 Attempting to fetch shareholders with range: ${range}`);
        shareholdersData = await fetchGoogleSheetsData(SHEET_ID, accessToken, range);
        console.log(`✅ Successfully fetched shareholders with range: ${range}, rows: ${shareholdersData.values?.length || 0}`);
        if (shareholdersData.values?.length > 0) {
          console.log(`📊 First shareholder row:`, shareholdersData.values[0]);
          console.log(`📊 Second shareholder row:`, shareholdersData.values[1]);
        }
        break;
      } catch (error) {
        console.warn(`⚠️ Failed to fetch with range ${range}:`, error.message);
        if (i === shareholdersAttempts.length - 1) {
          console.error('❌ All attempts to fetch Shareholders sheet failed');
          shareholdersData = { values: [] };
        }
      }
    }
    
    console.log(`📋 Companies data rows: ${companiesData.values?.length || 0}`);
    console.log(`👥 Directors data rows: ${directorsData.values?.length || 0}`);
    console.log(`📊 Shareholders data rows: ${shareholdersData.values?.length || 0}`);
    
    // Transform and validate data
    const companies = transformSheetsData(companiesData, directorsData, shareholdersData);
    console.log(`✅ Successfully processed ${companies.length} companies with directors`);
    
    // Return the transformed data
    return companies;
  } catch (error) {
    console.error('💥 Google Sheets fetch error:', error.message);
    throw error;
  }
};

// Create JWT for Google Service Account authentication
async function createServiceAccountJWT(serviceAccountEmail, privateKey) {
  try {
    console.log('🔑 Creating JWT...');
    
    // JWT header
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    // JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600, // 1 hour expiration
      iat: now
    };

    // Import private key for signing
    const privateKeyObj = await importPrivateKey(privateKey);
    
    // Create and sign JWT
    const headerEncoded = base64urlEncode(JSON.stringify(header));
    const payloadEncoded = base64urlEncode(JSON.stringify(payload));
    const dataToSign = `${headerEncoded}.${payloadEncoded}`;
    
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      privateKeyObj,
      new TextEncoder().encode(dataToSign)
    );
    
    const signatureEncoded = base64urlEncode(signature);
    
    return `${dataToSign}.${signatureEncoded}`;
    
  } catch (error) {
    throw new Error(`JWT creation failed: ${error.message}`);
  }
}

// Import PEM private key for Web Crypto API
async function importPrivateKey(pemKey) {
  try {
    // Handle both raw PEM and base64-encoded PEM
    let processedKey = pemKey;
    
    // If it doesn't start with -----BEGIN, it might be base64 encoded
    if (!pemKey.includes('-----BEGIN PRIVATE KEY-----')) {
      try {
        processedKey = atob(pemKey);
      } catch (e) {
        // If base64 decode fails, use as-is
      }
    }
    
    // Remove PEM headers and whitespace
    const pemContent = processedKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '');
    
    // Convert base64 to ArrayBuffer
    const keyData = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
    
    // Import the key
    return await crypto.subtle.importKey(
      'pkcs8',
      keyData,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );
  } catch (error) {
    throw new Error(`Private key import failed: ${error.message}`);
  }
}

// Base64URL encoding (different from regular base64)
function base64urlEncode(data) {
  let base64;
  if (data instanceof ArrayBuffer) {
    base64 = btoa(String.fromCharCode(...new Uint8Array(data)));
  } else {
    base64 = btoa(data);
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Exchange JWT for Google access token
async function getAccessToken(jwt) {
  console.log('🎫 Exchanging JWT for access token...');
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData = await response.json();
  return tokenData.access_token;
}

// Fetch data from Google Sheets API
async function fetchGoogleSheetsData(sheetId, accessToken, range = 'Sheet1!A2:L') {
  console.log(`📊 Fetching data from Google Sheets range: ${range}`);
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google Sheets API error: ${response.status} ${errorText}`);
  }

  return await response.json();
}

// Helper function to parse financial values, handling #N/A from Google Finance
function parseFinancialValue(value) {
  if (!value) return null;
  
  // Handle Google Finance #N/A values and errors
  const stringValue = String(value).trim();
  if (stringValue.includes('#N/A') || 
      stringValue.includes('#ERROR!') || 
      stringValue === '' || 
      stringValue === 'N/A' ||
      stringValue.includes('not available')) {
    return null;
  }
  
  // Try to parse as number
  const parsed = parseFloat(stringValue);
  return isNaN(parsed) ? null : parsed;
}

// Transform Google Sheets data to application format
function transformSheetsData(companiesData, directorsData, shareholdersData) {
  const companyRows = companiesData.values || [];
  const directorRows = directorsData.values || [];
  const shareholderRows = shareholdersData.values || [];
  
  console.log(`🔄 Transforming ${companyRows.length} companies, ${directorRows.length} directors, and ${shareholderRows.length} shareholders...`);
  
  // Process directors data first - now using ISIN for matching
  const directorsByISIN = {};
  directorRows.forEach((row, index) => {
    try {
      const companyName = row[0]?.trim();
      const isin = row[5]?.trim(); // ISIN is now in column F (index 5)
      const director = {
        name: row[1] || '',
        position: row[2] || '',
        appointmentDate: row[3] || '',
        bioUrl: row[4] || ''
      };
      
      // Use ISIN as the primary key for matching
      if (isin && director.name) {
        if (!directorsByISIN[isin]) {
          directorsByISIN[isin] = [];
        }
        directorsByISIN[isin].push(director);
        console.log(`👥 Added director ${director.name} for ISIN ${isin} (${companyName})`);
      } else if (companyName && director.name) {
        // Fallback to company name if ISIN is missing
        console.warn(`⚠️ Missing ISIN for director ${director.name} at ${companyName}, using company name as fallback`);
        if (!directorsByISIN[companyName]) {
          directorsByISIN[companyName] = [];
        }
        directorsByISIN[companyName].push(director);
      }
    } catch (error) {
      console.warn(`⚠️ Error parsing director row ${index + 2}:`, row, error.message);
    }
  });
  
  console.log(`👥 Processed directors for ${Object.keys(directorsByISIN).length} companies`);
  console.log(`📋 Director ISINs found:`, Object.keys(directorsByISIN));
  
  // Process shareholders data - now using ISIN for matching
  const shareholdersByISIN = {};
  shareholderRows.forEach((row, index) => {
    try {
      const ticker = row[0]?.trim(); // Ticker (e.g., ACS.MC)
      const companyName = row[1]?.trim(); // Company name
      const isin = row[5]?.trim(); // ISIN is now in column F (index 5)
      const shareholder = {
        name: row[2] || '', // Significant Shareholder  
        percentage: parseFloat(row[3]) || 0, // Ownership_percentage
        date: row[4] || '' // Date
      };
      
      console.log(`📊 Processing shareholder row ${index + 1}:`, {
        ticker,
        companyName,
        isin,
        shareholderName: shareholder.name,
        percentage: shareholder.percentage,
        date: shareholder.date
      });
      
      // Use ISIN as the primary key for matching
      if (isin && shareholder.name) {
        if (!shareholdersByISIN[isin]) {
          shareholdersByISIN[isin] = [];
        }
        shareholdersByISIN[isin].push(shareholder);
        console.log(`📊 Added shareholder ${shareholder.name} for ISIN ${isin} (${companyName})`);
      } else if (ticker && shareholder.name) {
        // Fallback to ticker if ISIN is missing
        console.warn(`⚠️ Missing ISIN for shareholder ${shareholder.name} at ${companyName}, using ticker as fallback`);
        if (!shareholdersByISIN[ticker]) {
          shareholdersByISIN[ticker] = [];
        }
        shareholdersByISIN[ticker].push(shareholder);
      }
    } catch (error) {
      console.warn(`⚠️ Error parsing shareholder row ${index + 2}:`, row, error.message);
    }
  });
  
  console.log(`📊 Processed shareholders for ${Object.keys(shareholdersByISIN).length} companies`);
  console.log(`📋 Shareholder ISINs found:`, Object.keys(shareholdersByISIN));
  
  // Debug: Log first few shareholder entries
  if (Object.keys(shareholdersByISIN).length > 0) {
    const firstCompany = Object.keys(shareholdersByISIN)[0];
    console.log(`📊 Sample shareholders for ${firstCompany}:`, JSON.stringify(shareholdersByISIN[firstCompany], null, 2));
  }
  
  // Process companies and match with directors
  const companies = companyRows
    .map((row, index) => {
      try {
        const company = {
          ticker: row[0] || '', // Column A: Ticker (e.g., ACS.MC)
          company: row[1] || '', // Column B: Company (e.g., ACS)
          sector: row[2] || '', // Column C: Sector (e.g., Construction)
          formattedTicker: row[3] || '', // Column D: Formatted_Ticker (e.g., BME:ACS)
          currentPriceEur: parseFloat(row[4]) || 0, // Column E: Current_Price_EUR
          marketCapEur: parseFloat(row[5]) || 0, // Column F: MarketCap_EUR
          volumeEur: parseFloat(row[6]) || 0, // Column G: Volume_EUR
          peRatio: parseFinancialValue(row[7]), // Column H: P/E
          eps: parseFinancialValue(row[8]), // Column I: EPS
          high52: parseFinancialValue(row[9]), // Column J: High52
          low52: parseFinancialValue(row[10]), // Column K: Low52
          priceChange: parseFinancialValue(row[11]), // Column L: Price_Change
          changePercent: parseFinancialValue(row[12]), // Column M: Price_Change_percentage
          isin: row[13] || '', // Column N: ISIN
          directors: [],
          shareholders: []
        };
        
        // Match directors using ISIN - much simpler and bulletproof!
        const matchedDirectors = directorsByISIN[company.isin];
        if (matchedDirectors) {
          company.directors = matchedDirectors;
          console.log(`📋 ISIN match: ${matchedDirectors.length} directors for ${company.company} (ISIN: ${company.isin})`);
        } else {
          console.log(`📋 No directors found for ${company.company} (ISIN: ${company.isin})`);
        }
        
        // Match shareholders using ISIN - consistent with directors
        const matchedShareholders = shareholdersByISIN[company.isin];
        if (matchedShareholders) {
          company.shareholders = matchedShareholders;
          console.log(`📊 ISIN match: ${matchedShareholders.length} shareholders for ${company.company} (ISIN: ${company.isin})`);
        } else {
          console.log(`📊 No shareholders found for ${company.company} (ISIN: ${company.isin})`);
        }
        
        return company;
      } catch (error) {
        console.warn(`⚠️ Error parsing company row ${index + 2}:`, row, error.message);
        return null;
      }
    })
    .filter(company => 
      company && 
      company.ticker && 
      company.company && 
      company.currentPriceEur > 0
    );
    
  const totalDirectors = companies.reduce((sum, company) => sum + company.directors.length, 0);
  const totalShareholders = companies.reduce((sum, company) => sum + company.shareholders.length, 0);
  console.log(`✅ Successfully transformed ${companies.length} companies with ${totalDirectors} total directors and ${totalShareholders} total shareholders`);
  return companies;
}

// Handle /api/news endpoint - news operations
async function handleNewsOperations(db, request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('companyId');
  const companyIds = url.searchParams.get('companyIds');
  const limit = parseInt(url.searchParams.get('limit')) || 20;

  try {
    if (request.method === 'GET') {
      let news;
      if (companyId) {
        // Get news for a specific company
        news = await db.getNewsForCompany(companyId, limit);
      } else if (companyIds) {
        // Get news for multiple companies
        const ids = companyIds.split(',');
        news = await db.getNewsForCompanies(ids, limit);
      } else {
        // Get general market news
        news = await db.getMarketNews(limit);
      }

      return new Response(JSON.stringify({
        success: true,
        news,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } else if (request.method === 'POST') {
      // Save news articles
      const body = await request.json();
      
      if (Array.isArray(body.newsItems)) {
        // Save multiple news items
        const result = await db.saveMultipleNewsItems(body.newsItems);
        return new Response(JSON.stringify({
          success: true,
          result,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else if (body.newsItem) {
        // Save single news item
        const result = await db.saveNewsItem(body.newsItem);
        return new Response(JSON.stringify({
          success: true,
          result,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        return createErrorResponse('Invalid request body', 400);
      }
    } else {
      return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('News operation error:', error);
    return createErrorResponse(`News operation failed: ${error.message}`, 500);
  }
}

// Handle /api/news/analytics endpoint - news analytics
async function handleNewsAnalytics(db, request) {
  const url = new URL(request.url);
  const companyId = url.searchParams.get('companyId');
  const days = parseInt(url.searchParams.get('days')) || 30;

  try {
    if (request.method === 'GET') {
      if (companyId) {
        // Get sentiment analysis for a specific company
        const sentimentAnalysis = await db.getNewsSentimentAnalysis(companyId, days);
        return new Response(JSON.stringify({
          success: true,
          sentimentAnalysis,
          companyId,
          days,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } else {
        // Get news analytics overview for all companies
        const overview = await db.getNewsAnalyticsOverview(days);
        return new Response(JSON.stringify({
          success: true,
          overview,
          days,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } else {
      return createErrorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('News analytics error:', error);
    return createErrorResponse(`News analytics failed: ${error.message}`, 500);
  }
}

// Create standardized error response
function createErrorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    status
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}