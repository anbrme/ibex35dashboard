// Quick OAuth2 implementation for testing
// This uses your existing Google Client ID and Secret

export async function onRequest(context) {
  const { request, env } = context;
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      }
    });
  }

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Check for OAuth2 credentials
    const CLIENT_ID = env.GOOGLE_CLIENT_ID;
    const CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    const REFRESH_TOKEN = env.GOOGLE_REFRESH_TOKEN;
    const SHEET_ID = env.GOOGLE_SHEET_ID;
    
    if (!CLIENT_ID || !CLIENT_SECRET || !SHEET_ID) {
      console.error('Missing OAuth2 environment variables');
      return createErrorResponse('Missing OAuth2 configuration. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_SHEET_ID in Cloudflare environment variables.', 500);
    }

    if (!REFRESH_TOKEN) {
      return createErrorResponse('Missing GOOGLE_REFRESH_TOKEN. Please generate one using Google OAuth Playground: https://developers.google.com/oauthplayground/', 500);
    }

    console.log('🔑 Using OAuth2 authentication...');
    
    // Get access token using refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        refresh_token: REFRESH_TOKEN,
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Token refresh failed: ${tokenResponse.status} ${errorText}`);
    }

    const { access_token } = await tokenResponse.json();

    // Fetch data from Google Sheets
    const sheetsResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A2:G?valueRenderOption=UNFORMATTED_VALUE`,
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

    // Transform data
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

    console.log(`✅ Successfully fetched ${companies.length} companies via OAuth2`);
    
    return new Response(JSON.stringify({
      success: true,
      data: companies,
      count: companies.length,
      lastUpdated: new Date().toISOString(),
      source: 'google-sheets-oauth2'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // 5-minute cache
      }
    });

  } catch (error) {
    console.error('🔥 OAuth2 authentication error:', error);
    return createErrorResponse(error.message, 500);
  }
}

function createErrorResponse(message, status = 500) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    status,
    helpUrl: 'https://github.com/anbrme/ibex35dashboard/blob/main/SECURE_SETUP.md'
  }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    }
  });
}