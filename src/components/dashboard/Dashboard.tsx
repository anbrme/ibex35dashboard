import { useState, useEffect } from 'react';
import { CompanyCard } from './CompanyCard';
import { CompanyDetails } from './CompanyDetails';
import { SectorChart, PerformanceChart, MarketCapChart } from '../charts';
import { DataService } from '../../services/dataService';
import type { DatabaseCompany, CompanyPrice } from '../../types/database';

export function Dashboard() {
  const [companies, setCompanies] = useState<(DatabaseCompany & { latestPrice?: CompanyPrice | null })[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<DatabaseCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'marketCap' | 'changePercent'>('name');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await DataService.initializeFullDataset();
        const marketData = await DataService.getMarketOverview();
        if (marketData) {
          setCompanies(marketData.companies);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sectors = ['all', ...new Set(companies.map(c => c.sector).filter(Boolean))];
  
  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSector = selectedSector === 'all' || company.sector === selectedSector;
    return matchesSearch && matchesSector;
  });

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'marketCap':
        return (b.marketCap || 0) - (a.marketCap || 0);
      case 'changePercent':
        return (b.latestPrice?.changePercent || 0) - (a.latestPrice?.changePercent || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading IBEX 35 Dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">This may take a moment as we fetch the latest data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IBEX 35 Dashboard</h1>
              <p className="text-gray-600 mt-1">Comprehensive analysis of Spain's top companies</p>
            </div>
            <div className="mt-4 md:mt-0">
              <button 
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Charts Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Market Overview</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SectorChart companies={companies} />
            <MarketCapChart companies={companies} />
          </div>
          <div className="mb-6">
            <PerformanceChart 
              companies={companies} 
              title="Top Performers by Change %" 
              metric="changePercent"
              limit={10}
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">Companies</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {sectors.map(sector => (
                  <option key={sector} value={sector}>
                    {sector === 'all' ? 'All Sectors' : sector}
                  </option>
                ))}
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'marketCap' | 'changePercent')}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="name">Sort by Name</option>
                <option value="marketCap">Sort by Market Cap</option>
                <option value="changePercent">Sort by Performance</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            Showing {sortedCompanies.length} of {companies.length} companies
          </div>
        </div>

        {/* Companies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCompanies.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              latestPrice={company.latestPrice}
              onClick={() => setSelectedCompany(company)}
            />
          ))}
        </div>

        {sortedCompanies.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No companies found matching your criteria</p>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedSector('all');
              }}
              className="mt-4 text-blue-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Company Details Modal */}
      {selectedCompany && (
        <CompanyDetails
          company={selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      )}
    </div>
  );
}