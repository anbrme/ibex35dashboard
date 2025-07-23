import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, TrendingUp, BarChart3, PieChart, RefreshCw } from 'lucide-react';
import { ModernCompanyCard } from './ModernCompanyCard';
import { useSecureIbex35Data } from '../../hooks/useSecureIbex35Data';
import { useNavigate } from 'react-router-dom';

export function ModernDashboard() {
  const { companies, loading, refetch } = useSecureIbex35Data();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'company' | 'currentPriceEur' | 'marketCapEur'>('marketCapEur');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const sectors = ['all', ...new Set(companies.map(c => c.sector))];
  
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.formattedTicker.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'all' || company.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case 'company':
        return a.company.localeCompare(b.company);
      case 'currentPriceEur':
        return b.currentPriceEur - a.currentPriceEur;
      case 'marketCapEur':
        return b.marketCapEur - a.marketCapEur;
      default:
        return 0;
    }
  });

  const totalMarketCap = companies.reduce((sum, company) => sum + company.marketCapEur, 0);
  const avgPrice = companies.length > 0 ? companies.reduce((sum, company) => sum + company.currentPriceEur, 0) / companies.length : 0;
  const totalVolume = companies.reduce((sum, company) => sum + company.volumeEur, 0);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
    return `€${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            Loading IBEX 35 Data...
          </h2>
          <p className="text-gray-500 dark:text-gray-400">Please wait a moment.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <header className="bg-white dark:bg-gray-800 shadow-md mb-8">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">IBEX 35 Dashboard</h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Spain's premier stock index analysis
              </p>
            </div>
            <motion.button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="mt-4 md:mt-0 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 flex items-center gap-2"
              whileTap={{ scale: 0.95 }}
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </motion.button>
          </div>
        </div>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <PieChart className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Market Cap</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatNumber(totalMarketCap)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Price</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">€{avgPrice.toFixed(2)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <TrendingUp className="w-8 h-8 text-indigo-500" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Volume</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{formatNumber(totalVolume)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {sectors.map(sector => (
                <option key={sector} value={sector}>
                  {sector === 'all' ? 'All Sectors' : sector}
                </option>
              ))}
            </select>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'company' | 'currentPriceEur' | 'marketCapEur')}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="marketCapEur">Sort by Market Cap</option>
            <option value="currentPriceEur">Sort by Price</option>
            <option value="company">Sort by Name</option>
          </select>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {sortedCompanies.length} of {companies.length} companies
        </div>
      </div>

      <AnimatePresence>
        {sortedCompanies.length > 0 ? (
          <motion.div
            key="companies-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid gap-6"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'
            }}
          >
            {sortedCompanies.map((company, index) => (
              <ModernCompanyCard
                key={company.ticker}
                company={company}
                index={index}
                onClick={() => navigate(`/company/${company.ticker}`)}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="no-results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="text-center py-16"
          >
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md max-w-md mx-auto">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">No companies found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSector('all');
                }}
                className="text-blue-500 hover:text-blue-600 font-semibold"
              >
                Clear Filters
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}