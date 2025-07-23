import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Search, LineChart, Building, BarChart2 } from 'lucide-react';
import { ModernCompanyCard } from './ModernCompanyCard';
import { useSecureIbex35Data } from '../../hooks/useSecureIbex35Data';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';
import { Ibex35Metrics } from './Ibex35Metrics';

export function ModernDashboard() {
  const { companies, loading } = useSecureIbex35Data();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<SecureIBEXCompanyData | null>(null);

  const filteredCompanies = companies.filter(company =>
    company.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompanySelect = (company: SecureIBEXCompanyData) => {
    if (selectedCompany?.ticker === company.ticker) {
      setSelectedCompany(null);
    } else {
      setSelectedCompany(company);
    }
  };

  const totalMarketCap = companies.reduce((acc, company) => acc + company.marketCapEur, 0);
  const avgPrice = companies.reduce((acc, company) => acc + company.currentPriceEur, 0) / (companies.length || 1);
  const totalVolume = companies.reduce((acc, company) => acc + company.volumeEur, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-foreground">
            Loading Companies...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background font-sans text-foreground">
      {/* Left Column: Company List */}
      <aside className="w-[380px] border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h1 className="text-xl font-semibold">IBEX 35</h1>
          <p className="text-sm text-muted-foreground">Spain's premier stock index</p>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by company or ticker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-secondary text-sm"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          <AnimatePresence>
            {filteredCompanies.map((company) => (
              <ModernCompanyCard
                key={company.ticker}
                company={company}
                isSelected={selectedCompany?.ticker === company.ticker}
                onSelect={handleCompanySelect}
              />
            ))}
          </AnimatePresence>
        </div>
      </aside>

      {/* Right Column: Visualization Area */}
      <main className="flex-1 flex flex-col">
        <Ibex35Metrics 
          totalMarketCap={totalMarketCap}
          avgPrice={avgPrice}
          totalVolume={totalVolume}
        />
        <div className="flex-grow p-6 flex flex-col items-center justify-center bg-muted/30">
          <div className="text-center">
            {selectedCompany ? 
              <>
                <BarChart2 className="w-16 h-16 text-muted-foreground/50 mx-auto" strokeWidth={1} />
                <p className="mt-4 text-muted-foreground">
                  Showing visualizations for <span className="font-semibold text-foreground">{selectedCompany.company}</span>
                </p>
              </>
              :
              <>
                <LineChart className="w-16 h-16 text-muted-foreground/50 mx-auto" strokeWidth={1} />
                <p className="mt-4 text-muted-foreground">Select a company to view detailed visualizations</p>
              </>
            }
          </div>
        </div>
      </main>
    </div>
  );
}