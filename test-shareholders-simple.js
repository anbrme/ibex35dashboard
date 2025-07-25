#!/usr/bin/env node

/**
 * Simple test script to verify Shareholders sheet access
 * Uses only Node.js built-in modules + fetch
 * Run with: node test-shareholders-simple.js
 */

import crypto from 'crypto';

// Environment variables (you can set these directly here for testing)
const CONFIG = {
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'service-account-name-ibex35-sh@ibex35.iam.gserviceaccount.com',
  GOOGLE_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDUN3PxoNJHQXKv\ny0x+OV+eXpr58cI/m91ppPbLEbsjijHKf6yJBlzJUpzgTTKXrxgGYpG2d/hOboWO\n1DNO1FJ0R13fLntjEeIO+Z9gEX89p0zBB0ZjTreXNySlG5HZAJP8vrMGBaZ3+CHp\npQ7tJjzdNId6YIm7q3FXReZuFBb5gb1deZ3b2QyVRzKKRddp+j6EWR+CTXlk3m4R\n3Mf3y8AWhAmCp5GNIm2UGeCmWPEK+7gR9UpFU9UoshJXVmXshhfH20jdPrhMYmLQ\nUZXL8mgM1ID6rntGDOkMCtxtRWaRFqplW97LTo1VC4ZdeEk9eoFAQ+IYRD0u+RSz\n0H5ipU+FAgMBAAECggEACG8a9LufTJh4r8aubi0AWtfufggYrNR+xgF5xkCyWLHX\n7SQj13it3IzW+HPsLDd+OfEi7C1abF7CGhbe4ljxdsOU77DDBwEhiqM34IAkt9Uo\ngydmqb22i2D0QnrIOIEB+j9N+B6zXfzTkQIvuxPg9iptrY4DcbaMYgHAkn4wtFvC\ng36p4BktaukMjWIYMavzo+cibfUdFguQp+Xnh/KATRpKVHl0C8oGpKdghtP+8tJa\nSjuGWuKNAkeOKxlczmdGkXO5s9bRL8XjYqUbwqg3Y22YLmkDbjDvb0USoqh0Nw9c\nspPm13GpGYTtsVIySS9heGT+/EFhT5tZSMtNbhvrQQKBgQDr0ZJWMlYvBnm0ssft\n+3LGXj+4bE/m6tyIxEtT8iMxlIFSHuRHzgvF49tWQs65AqA/uiXV988PsreaK9cX\nUKPTXbTxBSiSIo4hPqfWxbrwxnCVZePtiQ0LpEiT1RudJ9IJtkQIAY6JwZHltXpB\nxK8YCZoic+vc+wMm1l2kpP3ZMQKBgQDmYMv1ek7rOxgqE+8kNgns47feYN8jVkPW\nOC9H2LfYcH8gKvRITqj2fNZ+xU3uePIYQip9UxxSV+focshD9TgiVem5SjndQSzH\nMBLp1341ehJXL6JUkuBzGM3A055UPbqYv4vqMgXw+2bVc5OaRq5VAg2SToER96A2\nn4dZ2QrGlQKBgQCOdG14ULQreDfxZsbMBsgQ+UJ5AEVMc7iBjkMLFQ0ZmGJ+31Z7\n4gbOppULiRQkQ2fW13afyTF2hDnRkoY++WHd/4+cwcb+cI13m8f8QDpr1RSRy5lj\nFxWgYL/PPj+OMk35u/dg9r/Ki/q8z2JpdI1pcfOAuJJVTfVbcsfi/CC1IQKBgCMQ\ngpq3ZgGpufDVneV+EB6tPlQrnGrte1/Ep3WhB8J6xO6pewryZgc2UxNyhn0QjZCh\nqYPvvXTPCm434kFttoCLYQqhwJLrk5wxtf8/nGcZUGdSybtjq6P5F4AM9aFOz/Ll\n3K7ltD/MlAdTExk9PtWTfWtSZZTNguYte9VyEpDNAoGAI4mNtzIA1UrZ4+SWnqR+\nuTwp5Cr+VNrtixDDoKNdk4iJe2+WzQ+8VUcJHezV8ugEvPBoeOML2tkUlfVBXVeR\nMeBxD6Ob44+8Ns7n5q51v/9aDORLJ2oM6/mJa5XPkhkh2VNb2bVdq4hL6cML28uV\nIAtddWv9h/0Y5iPNt99qGFE=\n-----END PRIVATE KEY-----\n',
  GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID || '11rpmdk6jWqwueio-aTJYoFBiNCmlnLhZ7jHPbvPrEJ0'
};

// JWT creation functions (copied from your worker code)
function base64urlEncode(data) {
  let base64;
  if (data instanceof ArrayBuffer) {
    base64 = Buffer.from(data).toString('base64');
  } else {
    base64 = Buffer.from(data).toString('base64');
  }
  
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

async function createServiceAccountJWT(serviceAccountEmail, privateKey) {
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  // Import private key
  let processedKey = privateKey;
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    try {
      processedKey = Buffer.from(privateKey, 'base64').toString();
    } catch (e) {
      // Use as-is
    }
  }

  const pemContent = processedKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const keyData = Buffer.from(pemContent, 'base64');

  const key = await crypto.subtle.importKey(
    'pkcs8',
    keyData,
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const headerEncoded = base64urlEncode(JSON.stringify(header));
  const payloadEncoded = base64urlEncode(JSON.stringify(payload));
  const dataToSign = `${headerEncoded}.${payloadEncoded}`;

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(dataToSign)
  );

  const signatureEncoded = base64urlEncode(signature);
  return `${dataToSign}.${signatureEncoded}`;
}

async function getAccessToken(jwt) {
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

async function fetchGoogleSheetsData(sheetId, accessToken, range) {
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

async function testShareholdersSheet() {
  console.log('🔍 Testing Shareholders sheet access...\n');

  // Check configuration
  if (!CONFIG.GOOGLE_SERVICE_ACCOUNT_EMAIL || !CONFIG.GOOGLE_PRIVATE_KEY) {
    console.error('❌ Missing Google Sheets credentials');
    console.log('\nPlease set environment variables:');
    console.log('export GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@...gserviceaccount.com"');
    console.log('export GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.log('export GOOGLE_SHEET_ID="11rpmdk6jWqwueio-aTJYoFBiNCmlnLhZ7jHPbvPrEJ0"');
    console.log('\nOr edit the CONFIG object in this script directly.');
    return;
  }

  try {
    console.log('🔐 Creating JWT token...');
    const jwt = await createServiceAccountJWT(CONFIG.GOOGLE_SERVICE_ACCOUNT_EMAIL, CONFIG.GOOGLE_PRIVATE_KEY);
    
    console.log('🎫 Getting access token...');
    const accessToken = await getAccessToken(jwt);
    
    console.log('✅ Authentication successful!');
    console.log(`📊 Sheet ID: ${CONFIG.GOOGLE_SHEET_ID}\n`);

    // Test different ranges
    const testRanges = [
      'Shareholders!A1:D10',
      'Shareholders!A2:D10',
      'Sheet3!A1:D10',
      'Sheet3!A2:D10'
    ];

    let shareholdersData = null;
    let successfulRange = null;

    for (const range of testRanges) {
      try {
        console.log(`🔍 Testing range: ${range}`);
        
        const response = await fetchGoogleSheetsData(CONFIG.GOOGLE_SHEET_ID, accessToken, range);
        const values = response.values;
        
        if (values && values.length > 0) {
          console.log(`✅ Success! Found ${values.length} rows`);
          shareholdersData = values;
          successfulRange = range;
          break;
        } else {
          console.log(`⚠️  Range accessible but no data found`);
        }
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }

    if (!shareholdersData) {
      console.log('\n❌ Could not access Shareholders sheet');
      console.log('\n📋 Possible issues:');
      console.log('1. Sheet is not named "Shareholders" or not in 3rd position');
      console.log('2. Service account doesn\'t have access to the sheet');
      console.log('3. Sheet has no data');
      return;
    }

    console.log(`\n✅ Found Shareholders data using: ${successfulRange}`);
    console.log(`📊 Rows: ${shareholdersData.length}\n`);

    // Show data structure
    console.log('📋 Data Preview:');
    console.log('='.repeat(60));
    
    shareholdersData.slice(0, 3).forEach((row, i) => {
      console.log(`Row ${i + 1}: ${JSON.stringify(row)}`);
    });

    // Validate format
    console.log('\n🔍 Format Check:');
    console.log('='.repeat(60));

    const hasHeaders = shareholdersData[0]?.some(cell => 
      typeof cell === 'string' && cell.toLowerCase().includes('company')
    );

    console.log(`Headers detected: ${hasHeaders ? 'Yes' : 'No'}`);
    
    const dataStart = hasHeaders ? 1 : 0;
    let validCount = 0;
    
    for (let i = dataStart; i < Math.min(shareholdersData.length, dataStart + 5); i++) {
      const row = shareholdersData[i];
      const company = row[0]?.toString().trim();
      const shareholder = row[1]?.toString().trim();
      const percentage = parseFloat(row[2]);
      
      if (company && shareholder && !isNaN(percentage) && percentage > 0) {
        validCount++;
        console.log(`✅ Row ${i + 1}: ${company} | ${shareholder} | ${percentage}%`);
      } else {
        console.log(`❌ Row ${i + 1}: Invalid data - ${JSON.stringify(row)}`);
      }
    }

    console.log(`\n📊 Summary: ${validCount} valid rows found`);
    
    if (validCount > 0) {
      console.log('\n✅ Shareholders sheet format looks good!');
      console.log(`Use range: ${successfulRange}`);
      console.log('The sync should work once the worker code is updated.');
    } else {
      console.log('\n❌ No valid data found. Check sheet format:');
      console.log('Expected: Company | Shareholder Name | Percentage | Date');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testShareholdersSheet().catch(console.error);