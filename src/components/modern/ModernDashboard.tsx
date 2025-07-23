import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Sparkles, TrendingUp, BarChart3, PieChart, RefreshCw } from 'lucide-react';
import { ModernCompanyCard } from './ModernCompanyCard';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';
import { SecureGoogleSheetsService } from '../../services/secureGoogleSheetsService';

export function ModernDashboard() {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'company' | 'currentPriceEur' | 'marketCapEur'>('marketCapEur');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await SecureGoogleSheetsService.fetchRealIBEXData();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    await fetchData();
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
  const avgPrice = companies.reduce((sum, company) => sum + company.currentPriceEur, 0) / companies.length;
  const totalVolume = companies.reduce((sum, company) => sum + company.volumeEur, 0);

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
    return `€${num.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-gradient flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin mx-auto"></div>
            <Sparkles className="w-8 h-8 text-primary-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-2xl font-display font-bold gradient-text mb-2">
            IBEX 35 Dashboard
          </h2>
          <p className="text-gray-400">Loading premium financial data...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-gradient">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border-b border-white/10 backdrop-blur-xl bg-dark-800/50"
      >
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-display font-bold gradient-text text-shadow-lg mb-2"
              >
                IBEX 35 Dashboard
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-gray-300"
              >
                Professional financial analysis for Spain's premier stock index
              </motion.p>
            </div>
            
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="glow-button px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </motion.button>
          </div>
        </div>
      </motion.header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <div className="market-card text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <PieChart className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wider">Total Market Cap</span>
            </div>
            <span className="text-2xl font-bold gradient-text">
              {formatNumber(totalMarketCap)}
            </span>
          </div>
          
          <div className="market-card text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wider">Average Price</span>
            </div>
            <span className="text-2xl font-bold gradient-text">
              €{avgPrice.toFixed(2)}
            </span>
          </div>
          
          <div className="market-card text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-primary-400" />
              <span className="text-sm text-gray-400 uppercase tracking-wider">Total Volume</span>
            </div>
            <span className="text-2xl font-bold gradient-text">
              {formatNumber(totalVolume)}
            </span>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-4 mb-6"
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-dark-800/60 border border-white/20 rounded-lg text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/50 transition-all backdrop-blur-sm"
              />
            </div>
            
            {/* Sector Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-primary-400" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-dark-800/60 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/50 transition-all appearance-none cursor-pointer backdrop-blur-sm"
              >
                {sectors.map(sector => (
                  <option key={sector} value={sector} className="bg-dark-800">
                    {sector === 'all' ? 'All Sectors' : sector}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'company' | 'currentPriceEur' | 'marketCapEur')}
              className="px-4 py-2.5 bg-dark-800/60 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-400/50 focus:border-primary-400/50 transition-all appearance-none cursor-pointer backdrop-blur-sm"
            >
              <option value="marketCapEur" className="bg-dark-800">Sort by Market Cap</option>
              <option value="currentPriceEur" className="bg-dark-800">Sort by Price</option>
              <option value="company" className="bg-dark-800">Sort by Name</option>
            </select>
          </div>
          
          <div className="mt-4 text-sm text-gray-400">
            Showing {sortedCompanies.length} of {companies.length} companies
          </div>
        </motion.div>

        {/* Companies Grid */}
        <AnimatePresence mode="wait">
          {sortedCompanies.length > 0 ? (
            <motion.div
              key="companies-grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.6 }}
              className="grid gap-4"
              style={{
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))'
              }}
            >
              {sortedCompanies.map((company, index) => (
                <ModernCompanyCard
                  key={company.ticker}
                  company={company}
                  index={index}
                  onClick={() => {
                    alert(`Opening comprehensive analysis for ${company.company}\n\nFeatures coming soon:\n• Complete director network\n• Shareholder analysis\n• Lobbying activities\n• Recent news\n• Regulatory filings`);
                  }}
                />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16"
            >
              <div className="glass-card p-8 max-w-md mx-auto">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No companies found</h3>
                <p className="text-gray-400 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSector('all');
                  }}
                  className="text-primary-400 hover:text-primary-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}