// Scheduled Cron Worker for IBEX 35 Data Sync
// Runs every hour to sync Google Sheets data to D1

export default {
  async scheduled(event, env, ctx) {
    console.log('🕐 Starting scheduled data sync...');
    
    try {
      // Call the sync API endpoint
      const syncResponse = await fetch(`${env.WORKER_URL}/api/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.CRON_SECRET || 'internal'}`
        }
      });

      if (!syncResponse.ok) {
        throw new Error(`Sync failed: ${syncResponse.status} ${syncResponse.statusText}`);
      }

      const syncResult = await syncResponse.json();
      console.log('✅ Scheduled sync completed:', syncResult);

      // Optional: Send notification or log to external service
      if (env.SLACK_WEBHOOK_URL) {
        await fetch(env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `IBEX 35 Data Sync Complete: ${syncResult.results.companies.recordsProcessed} companies, ${syncResult.results.directors.peopleProcessed} directors`
          })
        });
      }

    } catch (error) {
      console.error('💥 Scheduled sync failed:', error);
      
      // Send error notification
      if (env.SLACK_WEBHOOK_URL) {
        await fetch(env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `❌ IBEX 35 Data Sync Failed: ${error.message}`
          })
        });
      }
    }
  }
};