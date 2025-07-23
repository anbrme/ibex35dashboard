#!/usr/bin/env node

// Helper script to encode Google Service Account private key for Cloudflare
// Usage: node scripts/encode-private-key.js path/to/service-account.json

const fs = require('fs');
const path = require('path');

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('📖 Usage: node scripts/encode-private-key.js path/to/service-account.json');
    console.log('');
    console.log('This script helps you prepare your Google Service Account credentials');
    console.log('for secure storage in Cloudflare Pages environment variables.');
    process.exit(1);
  }

  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ File not found:', filePath);
    process.exit(1);
  }

  try {
    console.log('🔐 Processing Google Service Account credentials...');
    console.log('');
    
    // Read and parse the JSON file
    const jsonContent = fs.readFileSync(filePath, 'utf8');
    const serviceAccount = JSON.parse(jsonContent);
    
    // Validate required fields
    if (!serviceAccount.client_email || !serviceAccount.private_key) {
      console.error('❌ Invalid service account file. Missing client_email or private_key.');
      process.exit(1);
    }
    
    // Base64 encode the private key
    const privateKeyBase64 = Buffer.from(serviceAccount.private_key).toString('base64');
    
    console.log('✅ Service Account Configuration for Cloudflare Pages:');
    console.log('');
    console.log('📋 Add these environment variables in Cloudflare Pages Dashboard:');
    console.log('   Settings → Environment Variables → Production');
    console.log('');
    console.log('🔧 Environment Variables:');
    console.log('');
    console.log('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    console.log(serviceAccount.client_email);
    console.log('');
    console.log('GOOGLE_PRIVATE_KEY');
    console.log(privateKeyBase64);
    console.log('');
    console.log('GOOGLE_SHEET_ID');
    console.log('(Add your Google Sheet ID from the URL)');
    console.log('');
    console.log('🔒 Security Notes:');
    console.log('• These credentials are for SERVER-SIDE use only');
    console.log('• Never commit the JSON file or these values to git');
    console.log('• Store them securely in Cloudflare Pages environment variables');
    console.log('• The private key is base64 encoded for safe storage');
    console.log('');
    console.log('📊 Next Steps:');
    console.log('1. Share your Google Sheet with:', serviceAccount.client_email);
    console.log('2. Give it "Viewer" permission');
    console.log('3. Add the environment variables above to Cloudflare Pages');
    console.log('4. Deploy your application');
    console.log('5. Test the API endpoint: https://your-app.pages.dev/api/sheets-secure');
    console.log('');
    console.log('✨ Your IBEX 35 dashboard will then use real Google Sheets data!');
    
  } catch (error) {
    console.error('❌ Error processing file:', error.message);
    process.exit(1);
  }
}

main();