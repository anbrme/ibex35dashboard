// Cloudflare Workers function for secure Google Sheets access
// This runs on the edge, not in the browser

export async function onRequest(context) {
  const { request, env } = context;
  
  // Only allow GET requests
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // These environment variables are set in Cloudflare Pages dashboard
    const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET;
    const GOOGLE_SHEET_ID = env.GOOGLE_SHEET_ID;
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_SHEET_ID) {
      return new Response('Missing Google credentials', { status: 500 });
    }

    // Get access token using service account or OAuth2
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: env.GOOGLE_REFRESH_TOKEN, // You'll need to generate this once
        grant_type: 'refresh_token'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
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
      throw new Error('Failed to fetch from Google Sheets');
    }

    const sheetsData = await sheetsResponse.json();
    const rows = sheetsData.values || [];

    // Transform data to match your interface
    const companies = rows.map(row => ({
      ticker: row[0] || '',
      company: row[1] || '',
      sector: row[2] || '',
      formattedTicker: row[3] || '',
      currentPriceEur: parseFloat(row[4]) || 0,
      marketCapEur: parseFloat(row[5]) || 0,
      volumeEur: parseFloat(row[6]) || 0,
    }));

    return new Response(JSON.stringify(companies), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}