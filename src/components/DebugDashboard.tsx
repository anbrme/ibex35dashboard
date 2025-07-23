import { useState, useEffect } from 'react';
import { SecureGoogleSheetsService } from '../services/secureGoogleSheetsService';
import type { SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';

export function DebugDashboard() {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      try {
        console.log('Fetching data...');
        const data = await SecureGoogleSheetsService.fetchRealIBEXData();
        console.log('Data received:', data);
        setCompanies(data);
      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <h1 className="text-3xl font-bold mb-8">IBEX 35 Debug Dashboard</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Companies ({companies.length})</h2>
        <div className="grid gap-4">
          {companies.slice(0, 5).map((company) => (
            <div 
              key={company.ticker} 
              className="p-4 bg-card border rounded-lg"
            >
              <h3 className="font-semibold">{company.company}</h3>
              <p className="text-muted-foreground">{company.sector}</p>
              <p className="text-sm">Price: €{company.currentPriceEur.toFixed(2)}</p>
              <p className="text-sm">Directors: {company.directors.length}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
        <div className="bg-muted p-4 rounded-lg">
          <p>Total companies: {companies.length}</p>
          <p>Companies with directors: {companies.filter(c => c.directors.length > 0).length}</p>
          <p>Loading: {loading.toString()}</p>
          <p>Error: {error || 'None'}</p>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4">Raw Data (First Company)</h2>
        <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
          {JSON.stringify(companies[0], null, 2)}
        </pre>
      </div>
    </div>
  );
}