// Dedicated Cloudflare Worker for IBEX 35 Google Sheets API
// More reliable than Pages Functions

export default {
  async fetch(request, env) {
    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Cache-Control, Accept',
          'Access-Control-Max-Age': '86400',
        }
      });
    }

    if (request.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    try {
      console.log('🚀 Starting IBEX 35 data fetch...');
      
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
        return createErrorResponse('Server configuration error - missing credentials', 500);
      }

      console.log(`🔐 Using service account: ${SERVICE_ACCOUNT_EMAIL}`);
      console.log(`📊 Sheet ID: ${SHEET_ID}`);
      
      // Create JWT for service account authentication
      const jwt = await createServiceAccountJWT(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY);
      console.log('✅ JWT created successfully');
      
      // Exchange JWT for access token
      const accessToken = await getAccessToken(jwt);
      console.log('✅ Access token obtained');
      
      // Fetch data from Google Sheets
      const sheetsData = await fetchGoogleSheetsData(SHEET_ID, accessToken);
      console.log(`📋 Raw data rows: ${sheetsData.values?.length || 0}`);
      
      // Transform and validate data
      const companies = transformSheetsData(sheetsData);
      console.log(`✅ Successfully processed ${companies.length} companies`);
      
      return new Response(JSON.stringify({
        success: true,
        data: companies,
        count: companies.length,
        lastUpdated: new Date().toISOString(),
        source: 'cloudflare-worker-service-account'
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300, s-max-age=300', // 5-minute cache
        }
      });

    } catch (error) {
      console.error('💥 Worker error:', error.message);
      console.error('Stack:', error.stack);
      return createErrorResponse(`Authentication failed: ${error.message}`, 500);
    }
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
async function fetchGoogleSheetsData(sheetId, accessToken) {
  console.log('📊 Fetching data from Google Sheets...');
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A2:G?valueRenderOption=UNFORMATTED_VALUE`;
  
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
function transformSheetsData(sheetsData) {
  const rows = sheetsData.values || [];
  console.log(`🔄 Transforming ${rows.length} rows...`);
  
  const companies = rows
    .map((row, index) => {
      try {
        return {
          ticker: row[0] || '',
          company: row[1] || '',
          sector: row[2] || '',
          formattedTicker: row[3] || '',
          currentPriceEur: parseFloat(row[4]) || 0,
          marketCapEur: parseFloat(row[5]) || 0,
          volumeEur: parseFloat(row[6]) || 0,
        };
      } catch (error) {
        console.warn(`⚠️ Error parsing row ${index + 2}:`, row, error.message);
        return null;
      }
    })
    .filter(company => 
      company && 
      company.ticker && 
      company.company && 
      company.currentPriceEur > 0
    );
    
  console.log(`✅ Successfully transformed ${companies.length} valid companies`);
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