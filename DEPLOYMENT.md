# Deployment Guide for IBEX 35 Dashboard

This document provides instructions for deploying the IBEX 35 Dashboard to Cloudflare Pages.

## Prerequisites

1. Cloudflare account with Pages enabled
2. GitHub repository containing the project
3. Node.js 18+ for local development

## Cloudflare Pages Setup

### Option 1: Automatic Deployment via GitHub Integration

1. **Connect Repository to Cloudflare Pages:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Navigate to Pages
   - Click "Create a project"
   - Select "Connect to Git"
   - Choose your GitHub repository

2. **Configure Build Settings:**
   ```
   Framework preset: None
   Build command: npm run build
   Build output directory: dist
   Root directory: /
   ```

3. **Environment Variables:**
   - `NODE_VERSION`: 18
   - Add any API keys if using real data sources:
     - `ALPHA_VANTAGE_API_KEY`
     - `NEWS_API_KEY`

### Option 2: Manual Deployment with Wrangler CLI

1. **Install Wrangler:**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare:**
   ```bash
   wrangler login
   ```

3. **Deploy:**
   ```bash
   npm run build
   wrangler pages deploy dist --project-name ibex35dashboard
   ```

## GitHub Actions Deployment

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) for automatic deployment.

### Required GitHub Secrets:

1. `CLOUDFLARE_API_TOKEN`: 
   - Go to Cloudflare Dashboard → My Profile → API Tokens
   - Create token with "Cloudflare Pages:Edit" permissions

2. `CLOUDFLARE_ACCOUNT_ID`:
   - Found in Cloudflare Dashboard → Right sidebar

### Workflow Triggers:
- Push to main branch
- Pull requests to main branch (preview deployments)

## Custom Domain Setup

1. **Add Custom Domain in Cloudflare Pages:**
   - Go to your Pages project → Custom domains
   - Add your domain (e.g., `ibex35.your-domain.com`)

2. **Update DNS:**
   - Add CNAME record pointing to your Pages domain
   - Or use Cloudflare nameservers for full integration

## Environment Configuration

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

## Performance Optimizations

The deployment includes:

- **Caching Headers**: Static assets cached for 1 year
- **Security Headers**: HSTS, XSS protection, content type sniffing protection
- **Compression**: Automatic Brotli/Gzip compression by Cloudflare
- **CDN**: Global CDN distribution

## API Considerations

### CORS Issues
If using external APIs, you may need to:

1. **Use Cloudflare Workers** for API proxying:
   ```javascript
   // functions/api/proxy.js
   export async function onRequest({ request }) {
     const url = new URL(request.url);
     const targetUrl = 'https://api.example.com' + url.pathname.replace('/api/proxy', '');
     
     const response = await fetch(targetUrl, {
       headers: {
         'User-Agent': 'IBEX35Dashboard/1.0',
         // Add API keys here
       }
     });
     
     const data = await response.text();
     return new Response(data, {
       headers: {
         'Content-Type': 'application/json',
         'Access-Control-Allow-Origin': '*',
       }
     });
   }
   ```

2. **Update API endpoints** in your services to use `/api/proxy/*`

## Monitoring and Analytics

### Cloudflare Analytics
- Automatic page views and performance metrics
- Available in Cloudflare Dashboard → Analytics

### Error Tracking
Consider adding error tracking service:
```javascript
// In your main.tsx
if (import.meta.env.PROD) {
  // Add error tracking (Sentry, LogRocket, etc.)
}
```

## Security Considerations

1. **API Keys**: Never commit API keys to the repository
2. **Rate Limiting**: Implement client-side rate limiting for API calls
3. **Content Security Policy**: Consider adding CSP headers
4. **Input Validation**: Validate all user inputs

## Troubleshooting

### Common Issues:

1. **Build Failures:**
   - Check Node.js version (should be 18+)
   - Verify all dependencies are installed
   - Check TypeScript errors

2. **API CORS Issues:**
   - Use Cloudflare Workers for API proxying
   - Check API endpoint configurations

3. **Performance Issues:**
   - Enable Cloudflare caching
   - Optimize image sizes
   - Consider code splitting for large bundles

### Build Logs:
```bash
# Local build with verbose output
npm run build -- --mode development

# Check bundle size
npm run build && npx vite-bundle-analyzer dist
```

## Maintenance

### Regular Updates:
1. Update dependencies monthly
2. Monitor API rate limits
3. Check Cloudflare usage metrics
4. Update company data sources as needed

### Backup Strategy:
- Repository is the source of truth
- Database schema is version controlled
- Configuration files are in Git

## Support

For deployment issues:
1. Check Cloudflare Pages documentation
2. Review build logs in Cloudflare Dashboard
3. Check GitHub Actions logs for CI/CD issues
4. Verify all environment variables are set correctly