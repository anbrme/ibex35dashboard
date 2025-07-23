// Cloudflare Workers function using Google Service Account
// This is the most secure approach for server-side access

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Environment variables set in Cloudflare Pages
    const SERVICE_ACCOUNT_EMAIL = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const PRIVATE_KEY = env.GOOGLE_PRIVATE_KEY; // Base64 encoded private key
    const GOOGLE_SHEET_ID = env.GOOGLE_SHEET_ID;
    
    if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !GOOGLE_SHEET_ID) {
      return new Response('Missing service account credentials', { status: 500 });
    }

    // Create JWT for Google Service Account authentication
    const jwt = await createServiceAccountJWT(SERVICE_ACCOUNT_EMAIL, PRIVATE_KEY);
    
    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get service account token');
    }

    const { access_token } = await tokenResponse.json();

    // Fetch data from Google Sheets
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Sheet1!A2:G?valueRenderOption=UNFORMATTED_VALUE`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
        }
      }
    );

    if (!sheetsResponse.ok) {
      const errorText = await sheetsResponse.text();
      throw new Error(`Google Sheets API error: ${sheetsResponse.status} ${errorText}`);
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];

    // Transform and validate data
    const companies = rows
      .map(row => ({
        ticker: row[0] || '',
        company: row[1] || '',
        sector: row[2] || '',
        formattedTicker: row[3] || '',
        currentPriceEur: parseFloat(row[4]) || 0,
        marketCapEur: parseFloat(row[5]) || 0,
        volumeEur: parseFloat(row[6]) || 0,
      }))
      .filter(company => company.ticker && company.company && company.currentPriceEur > 0);

    return new Response(JSON.stringify({
      success: true,
      data: companies,
      count: companies.length,
      lastUpdated: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Sheets service error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// Helper function to create JWT for Service Account authentication
async function createServiceAccountJWT(serviceAccountEmail, privateKeyBase64) {
  const privateKeyPem = atob(privateKeyBase64);
  
  // JWT Header
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  // JWT Payload
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail, // Service account email
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600, // 1 hour
    iat: now
  };

  // Create JWT
  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Sign with private key (this is simplified - in production you'd use proper crypto)
  // For Cloudflare Workers, you'd use the Web Crypto API
  const key = await importPrivateKey(privateKeyPem);
  const signature = await sign(unsignedToken, key);
  const encodedSignature = base64urlEncode(signature);

  return `${unsignedToken}.${encodedSignature}`;
}

function base64urlEncode(data) {
  return btoa(data)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Note: These crypto functions would need proper implementation
// This is a simplified version - use proper Web Crypto API in production
async function importPrivateKey(pemKey) {
  // Implementation would use crypto.subtle.importKey()
  return pemKey;
}

async function sign(data, key) {
  // Implementation would use crypto.subtle.sign()
  return data;
}