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
          'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Accept',
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
    } else if (path === '/api/network') {
      return handleNetworkData(db, request);
    } else if (path === '/api/status') {
      return handleSyncStatus(db);
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
      
      // Sync to D1
      const companiesResult = await db.syncCompaniesData(companiesData);
      const directorsResult = await db.syncDirectorsData(companiesData);
      
      // Log sync operation
      await db.logSyncOperation('scheduled_sync', companiesData.length, 'completed');
      
      console.log('✅ Scheduled sync completed:', {
        companies: companiesResult.recordsProcessed,
        directors: directorsResult.peopleProcessed
      });

      // Optional: Send notification or log to external service
      if (env.SLACK_WEBHOOK_URL) {
        await fetch(env.SLACK_WEBHOOK_URL, {
          method: 'POST',  
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `IBEX 35 Scheduled Sync Complete: ${companiesResult.recordsProcessed} companies, ${directorsResult.peopleProcessed} directors`
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
    
    // Sync to D1
    const companiesResult = await db.syncCompaniesData(companiesData);
    const directorsResult = await db.syncDirectorsData(companiesData);
    
    // Log sync operation
    await db.logSyncOperation('full_sync', companiesData.length, 'completed');
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Data sync completed',
      results: {
        companies: companiesResult,
        directors: directorsResult
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
    const companiesData = await fetchGoogleSheetsData(SHEET_ID, accessToken, 'Sheet1!A2:G');
    
    console.log('👥 Fetching directors from Directors sheet...');
    let directorsData;
    
    // Try multiple approaches to access the Directors sheet
    const directorsAttempts = [
      'Directors!A2:E',
      'Directors!A1:E', 
      'Directors!A:E',
      "'Directors'!A2:E",  // With quotes
      'Sheet2!A2:E'        // Try by position
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
    
    console.log(`📋 Companies data rows: ${companiesData.values?.length || 0}`);
    console.log(`👥 Directors data rows: ${directorsData.values?.length || 0}`);
    
    // Transform and validate data
    const companies = transformSheetsData(companiesData, directorsData);
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
async function fetchGoogleSheetsData(sheetId, accessToken, range = 'Sheet1!A2:G') {
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

// Transform Google Sheets data to application format
function transformSheetsData(companiesData, directorsData) {
  const companyRows = companiesData.values || [];
  const directorRows = directorsData.values || [];
  
  console.log(`🔄 Transforming ${companyRows.length} companies and ${directorRows.length} directors...`);
  
  // Process directors data first
  const directorsByCompany = {};
  directorRows.forEach((row, index) => {
    try {
      const companyName = row[0]?.trim();
      const director = {
        name: row[1] || '',
        position: row[2] || '',
        appointmentDate: row[3] || '',
        bioUrl: row[4] || ''
      };
      
      if (companyName && director.name) {
        if (!directorsByCompany[companyName]) {
          directorsByCompany[companyName] = [];
        }
        directorsByCompany[companyName].push(director);
      }
    } catch (error) {
      console.warn(`⚠️ Error parsing director row ${index + 2}:`, row, error.message);
    }
  });
  
  console.log(`👥 Processed directors for ${Object.keys(directorsByCompany).length} companies`);
  console.log(`📋 Director company names found:`, Object.keys(directorsByCompany));
  
  // Process companies and match with directors
  const companies = companyRows
    .map((row, index) => {
      try {
        const company = {
          ticker: row[0] || '',
          company: row[1] || '',
          sector: row[2] || '',
          formattedTicker: row[3] || '',
          currentPriceEur: parseFloat(row[4]) || 0,
          marketCapEur: parseFloat(row[5]) || 0,
          volumeEur: parseFloat(row[6]) || 0,
          directors: []
        };
        
        // Try to match directors by company name variations
        const companyNameVariations = [
          company.company,
          company.company.replace(/\s+(S\.A\.|SA|S\.L\.|SL)$/i, ''),
          company.company.split(' ')[0] // First word only
        ];
        
        // Add specific mappings for known mismatches
        const specificMappings = {
          'Aena': ['ENAIRE', 'AENA'],
          'AENA': ['ENAIRE', 'Aena'],
          'Banco Santander': ['Santander'],
          'Banco Bilbao Vizcaya Argentaria': ['BBVA'],
          'Telefónica': ['Telefonica']
        };
        
        if (specificMappings[company.company]) {
          companyNameVariations.push(...specificMappings[company.company]);
        }
        
        console.log(`🔍 Trying to match company "${company.company}" with variations:`, companyNameVariations);
        
        // Also try reverse matching - check if company name appears in director company names
        let matchedDirectors = null;
        
        // First try exact matches
        for (const variation of companyNameVariations) {
          if (directorsByCompany[variation]) {
            matchedDirectors = directorsByCompany[variation];
            console.log(`📋 Exact match: ${matchedDirectors.length} directors for ${company.company} (via "${variation}")`);
            break;
          }
        }
        
        // If no exact match, try partial matching
        if (!matchedDirectors) {
          for (const directorCompanyName of Object.keys(directorsByCompany)) {
            for (const variation of companyNameVariations) {
              // Check if company name appears in director company name (case insensitive)
              if (directorCompanyName.toLowerCase().includes(variation.toLowerCase()) ||
                  variation.toLowerCase().includes(directorCompanyName.toLowerCase())) {
                matchedDirectors = directorsByCompany[directorCompanyName];
                console.log(`📋 Partial match: ${matchedDirectors.length} directors for ${company.company} (${variation} ↔ ${directorCompanyName})`);
                break;
              }
            }
            if (matchedDirectors) break;
          }
        }
        
        if (matchedDirectors) {
          company.directors = matchedDirectors;
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
  console.log(`✅ Successfully transformed ${companies.length} companies with ${totalDirectors} total directors`);
  return companies;
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