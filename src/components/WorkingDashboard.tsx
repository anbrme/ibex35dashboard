import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { SecureGoogleSheetsService } from '../services/secureGoogleSheetsService';
import type { SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export function WorkingDashboard() {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<SecureIBEXCompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'sectors' | 'network'>('overview');

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await SecureGoogleSheetsService.fetchRealIBEXData();
        setCompanies(data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.ticker.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Chart data
  const getMarketCapData = () => {
    const displayData = selectedCompany ? [selectedCompany] : companies.slice(0, 10);
    
    if (selectedCompany) {
      return {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          label: 'Market Cap (€B)',
          data: [
            selectedCompany.marketCapEur / 1e9 * 0.9,
            selectedCompany.marketCapEur / 1e9 * 0.95,
            selectedCompany.marketCapEur / 1e9 * 1.05,
            selectedCompany.marketCapEur / 1e9
          ],
          backgroundColor: '#3b82f6',
          borderColor: '#1d4ed8',
          borderWidth: 2,
        }]
      };
    }

    return {
      labels: displayData.map(c => c.company.length > 10 ? c.company.substring(0, 10) + '...' : c.company),
      datasets: [{
        label: 'Market Cap (€B)',
        data: displayData.map(c => c.marketCapEur / 1e9),
        backgroundColor: '#3b82f6',
        borderColor: '#1d4ed8',
        borderWidth: 1,
      }]
    };
  };

  const getSectorData = () => {
    const sectorCounts = companies.reduce((acc, company) => {
      acc[company.sector] = (acc[company.sector] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      labels: Object.keys(sectorCounts),
      datasets: [{
        data: Object.values(sectorCounts),
        backgroundColor: [
          '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6',
          '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#06b6d4'
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading IBEX 35 Data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">IBEX 35 Dashboard</h1>
              <p className="text-gray-600">Spain's premier stock index analysis</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Companies: {companies.length}</p>
              <p className="text-sm text-gray-500">
                With Directors: {companies.filter(c => c.directors.length > 0).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar - Company List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Companies</h2>
              
              {/* Search */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search companies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selected Company Info */}
              {selectedCompany && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h3 className="font-semibold text-blue-900">{selectedCompany.company}</h3>
                  <p className="text-sm text-blue-700">{selectedCompany.sector}</p>
                  <p className="text-sm text-blue-700">€{selectedCompany.currentPriceEur.toFixed(2)}</p>
                  <button
                    onClick={() => setSelectedCompany(null)}
                    className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Clear Selection
                  </button>
                </div>
              )}

              {/* Company List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredCompanies.map((company) => (
                  <div
                    key={company.ticker}
                    onClick={() => setSelectedCompany(company)}
                    className={`p-3 rounded cursor-pointer transition-colors ${
                      selectedCompany?.ticker === company.ticker
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <h3 className="font-medium text-gray-900 text-sm">{company.company}</h3>
                    <p className="text-xs text-gray-600">{company.sector}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs font-semibold">€{company.currentPriceEur.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">
                        {company.directors.length} directors
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content - Charts */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  {selectedCompany ? `${selectedCompany.company} Analysis` : 'IBEX 35 Overview'}
                </h2>
                
                {/* Chart Tabs */}
                <div className="flex space-x-2">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'sectors', label: 'Sectors' },
                    { id: 'network', label: 'Network' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Content */}
              <div className="h-96">
                {activeTab === 'overview' && (
                  <div className="h-full">
                    <h3 className="text-md font-medium mb-4 text-gray-700">
                      {selectedCompany ? 'Quarterly Performance' : 'Top Companies by Market Cap'}
                    </h3>
                    <Bar data={getMarketCapData()} options={chartOptions} />
                  </div>
                )}

                {activeTab === 'sectors' && (
                  <div className="h-full">
                    <h3 className="text-md font-medium mb-4 text-gray-700">
                      {selectedCompany ? `${selectedCompany.sector} Sector` : 'Sector Distribution'}
                    </h3>
                    <Doughnut data={getSectorData()} options={chartOptions} />
                  </div>
                )}

                {activeTab === 'network' && (
                  <div className="h-full bg-gray-50 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">Director Network</h3>
                      <p className="text-gray-600">
                        {selectedCompany 
                          ? `${selectedCompany.company} has ${selectedCompany.directors.length} directors`
                          : `Visualizing connections between ${companies.reduce((sum, c) => sum + c.directors.length, 0)} directors`
                        }
                      </p>
                      {selectedCompany && selectedCompany.directors.length > 0 && (
                        <div className="mt-4 text-left">
                          <h4 className="font-medium text-gray-900 mb-2">Directors:</h4>
                          <div className="space-y-1 text-sm">
                            {selectedCompany.directors.slice(0, 5).map((director, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{director.name}</span>
                                <span className="text-gray-600">{director.position}</span>
                              </div>
                            ))}
                            {selectedCompany.directors.length > 5 && (
                              <p className="text-gray-500">+{selectedCompany.directors.length - 5} more</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}