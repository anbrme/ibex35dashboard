import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LineChart, Building } from 'lucide-react';
import { ModernCompanyCard } from './ModernCompanyCard';
import { useSecureIbex35Data } from '../../hooks/useSecureIbex35Data';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

export function ModernDashboard() {
  const { companies, loading } = useSecureIbex35Data();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<SecureIBEXCompanyData | null>(null);

  const filteredCompanies = companies.filter(company =>
    company.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCompanySelect = (company: SecureIBEXCompanyData) => {
    setSelectedCompany(company);
  };
  
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
    return `€${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Loading Companies...
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900 font-sans">
      {/* Left Column: Company List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">IBEX 35 Companies</h2>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-800 text-sm"
            />
          </div>
        </div>
        <div className="flex-grow overflow-y-auto">
          <AnimatePresence>
            {filteredCompanies.map((company, index) => (
              <motion.div
                key={company.ticker}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.02 }}
              >
                <ModernCompanyCard
                  company={company}
                  isSelected={selectedCompany?.ticker === company.ticker}
                  onClick={() => handleCompanySelect(company)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: Visualization Area */}
      <div className="w-2/3 p-6 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        {selectedCompany ? (
          <div className="w-full max-w-4xl text-left">
            <motion.div initial={{ opacity: 0, y:20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedCompany.company}</h1>
              <p className="text-md text-gray-600 dark:text-gray-400">{selectedCompany.sector}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 text-sm">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">Price</p>
                  <p className="text-xl font-semibold text-gray-800 dark:text-white">€{selectedCompany.currentPriceEur.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">Market Cap</p>
                  <p className="text-xl font-semibold text-gray-800 dark:text-white">{formatNumber(selectedCompany.marketCapEur)}</p>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-500 dark:text-gray-400">Volume</p>
                  <p className="text-xl font-semibold text-gray-800 dark:text-white">{formatNumber(selectedCompany.volumeEur)}</p>
                </div>
              </div>

              <div className="mt-6 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                 <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Directors</h3>
                 <ul className="space-y-2 text-sm">
                   {selectedCompany.directors.map((director, idx) => (
                    <li key={idx} className="flex justify-between">
                      <span className="text-gray-700 dark:text-gray-300">{director.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{director.position}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="text-center">
            <LineChart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto" strokeWidth={1} />
            <p className="mt-4 text-gray-500 dark:text-gray-400">Select a company to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}