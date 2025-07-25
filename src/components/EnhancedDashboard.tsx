import { useState, useMemo, useCallback, useEffect } from 'react';
import { NewsService } from '../services/newsService';
import { LobbyingService } from '../services/lobbyingService';
import type { CompanyNews, LobbyingMeeting } from '../types/database';
import { Search, Building2, Users, Network, LineChart, PieChart, RefreshCw, Sparkles, BarChart3 } from 'lucide-react';
import { SecureGoogleSheetsService, type SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';
import { SimpleNetworkGraph } from './enhanced/SimpleNetworkGraph';
// import { EnhancedDirectorsPanel } from './enhanced/EnhancedDirectorsPanel';
import { ModernCompanyCard } from './enhanced/ModernCompanyCard';

// Removed VirtualList component - now using ModernCompanyCard grid

// Removed old CompanyRow component - now using ModernCompanyCard

// Removed old NetworkVisualization component - now using InteractiveNetworkGraph

// Main enhanced dashboard component
export function EnhancedDashboard() {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [news, setNews] = useState<CompanyNews[]>([]);
  const [lobbyingMeetings, setLobbyingMeetings] = useState<LobbyingMeeting[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'network' | 'sectors' | 'performance' | 'directors' | 'news' | 'lobbying'>('network');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>('');

  // Load initial data
  useEffect(() => {
    fetchData();
    fetchNewsAndLobbyingData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await SecureGoogleSheetsService.fetchRealIBEXData();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const fetchNewsAndLobbyingData = async () => {
    try {
      const newsData = await NewsService.fetchMarketNews();
      setNews(newsData);

      const lobbyingData = await LobbyingService.fetchLobbyingData();
      setLobbyingMeetings(lobbyingData);
    } catch (err) {
      console.error('Error fetching news or lobbying data:', err);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const success = await SecureGoogleSheetsService.syncData();
      if (success) {
        await fetchData(); // Reload data after sync
      }
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };
  
  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      (company.company || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.ticker || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (company.formattedTicker || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);
  
  const toggleCompanySelection = useCallback((companyId: string) => {
    setSelectedCompanyIds(prev => {
      const next = new Set(prev);
      if (next.has(companyId)) {
        next.delete(companyId);
      } else {
        next.add(companyId);
      }
      return next;
    });
  }, []);
  
  const clearSelection = useCallback(() => {
    setSelectedCompanyIds(new Set());
  }, []);
  
  // Calculate aggregated metrics
  const metrics = useMemo(() => {
    const selected = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies;
    
    if (selected.length === 0) {
      return { totalMarketCap: 0, avgPrice: 0, totalVolume: 0, totalDirectors: 0 };
    }
    
    return {
      totalMarketCap: selected.reduce((sum, c) => sum + (c.marketCapEur || 0), 0),
      avgPrice: selected.reduce((sum, c) => sum + (c.currentPriceEur || 0), 0) / selected.length,
      totalVolume: selected.reduce((sum, c) => sum + (c.volumeEur || 0), 0),
      totalDirectors: selected.reduce((sum, c) => sum + c.directors.length, 0)
    };
  }, [companies, selectedCompanyIds]);

  const renderNews = () => (
    <div>
      <h2>News</h2>
      {news.map((item) => (
        <div key={item.id}>
          <h3>{item.title}</h3>
          <p>{item.summary}</p>
          <a href={item.url} target="_blank" rel="noopener noreferrer">Read more</a>
        </div>
      ))}
    </div>
  );

  const renderLobbying = () => (
    <div>
      <h2>Lobbying Meetings</h2>
      {lobbyingMeetings.map((meeting) => (
        <div key={meeting.id}>
          <p>Organization: {meeting.organizationName}</p>
          <p>Date: {meeting.meetingDate.toDateString()}</p>
          <p>Purpose: {meeting.purpose}</p>
          <p>Topics: {meeting.topics.join(', ')}</p>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return activeView === 'news' ? renderNews() : activeView === 'lobbying' ? renderLobbying() : (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Loading IBEX 35 Intelligence...</h2>
          <p className="text-gray-600 mt-2">Preparing your advanced dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Left Panel - Company List */}
      <div className="w-96 bg-white/80 backdrop-blur-sm border-r border-white/20 flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">IBEX 35 Intelligence</h1>
              <p className="text-sm text-gray-600">Advanced Corporate Analysis</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </button>
            <div className="flex items-center px-3 py-2 bg-white/60 backdrop-blur-sm rounded-lg border border-white/40">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-xs text-gray-700 font-medium">
                D1 Database • {companies.length} companies
              </span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
            />
          </div>
          
          {/* Selection info */}
          {selectedCompanyIds.size > 0 && (
            <div className="mt-3 flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-sm font-medium text-blue-800">
                {selectedCompanyIds.size} companies selected
              </span>
              <button
                onClick={clearSelection}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* Company Cards Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {filteredCompanies.map((company) => (
              <ModernCompanyCard
                key={company.ticker}
                company={company}
                isSelected={selectedCompanyIds.has(company.ticker)}
                onToggle={() => toggleCompanySelection(company.ticker)}
              />
            ))}
          </div>
          
          {filteredCompanies.length === 0 && (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No companies found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Panel - Visualizations */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Metrics Bar */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-blue-500 rounded-md">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-blue-800">Market Cap</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">€{((metrics.totalMarketCap || 0) / 1e9).toFixed(1)}B</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-green-500 rounded-md">
                  <LineChart className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-green-800">Avg Price</span>
              </div>
              <div className="text-2xl font-bold text-green-900">€{(metrics.avgPrice || 0).toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-purple-500 rounded-md">
                  <PieChart className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-purple-800">Total Volume</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">€{((metrics.totalVolume || 0) / 1e6).toFixed(1)}M</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1 bg-amber-500 rounded-md">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-amber-800">Directors</span>
              </div>
              <div className="text-2xl font-bold text-amber-900">{metrics.totalDirectors}</div>
            </div>
          </div>
        </div>
        
        {/* Enhanced View Selector */}
        <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4">
          <div className="flex gap-3">
            {[
              { id: 'network', label: 'Network', icon: Network, description: 'Interactive graph' },
              { id: 'sectors', label: 'Sectors', icon: PieChart, description: 'Market distribution' },
              { id: 'performance', label: 'Performance', icon: LineChart, description: 'Price analysis' },
              { id: 'directors', label: 'Directors', icon: Users, description: 'Board analysis' },
            ].map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as 'network' | 'sectors' | 'performance' | 'directors' | 'news' | 'lobbying')}
                  className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                      : 'bg-white/60 hover:bg-white/80 text-gray-700 hover:text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className={`p-1 rounded-lg ${
                    isActive ? 'bg-white/20' : 'bg-gray-100 group-hover:bg-gray-200'
                  }`}>
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">{tab.label}</div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                      {tab.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Visualization Area */}
        <div className="flex-1 p-6 bg-gray-50">
          <div className="bg-white rounded-lg shadow-sm p-6 h-full">
            {activeView === 'network' && (
              <div className="h-full">
                <h2 className="text-lg font-semibold mb-4">Company & Director Network</h2>
                <SimpleNetworkGraph
                  companies={companies}
                  selectedCompanyIds={selectedCompanyIds}
                  width={800}
                  height={500}
                />
              </div>
            )}
            
            {activeView === 'sectors' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Sector Distribution</h2>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(
                    companies
                      .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker))
                      .reduce((acc, company) => {
                        acc[company.sector] = (acc[company.sector] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                  ).map(([sector, count]) => (
                    <div key={sector} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span>{sector}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeView === 'performance' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Performance Overview</h2>
                <div className="space-y-4">
                  {companies
                    .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker))
                    .sort((a, b) => b.marketCapEur - a.marketCapEur)
                    .slice(0, 10)
                    .map(company => {
                      const changePercent = company.changePercent || 0;
                      return (
                        <div key={company.ticker} className="flex items-center gap-4">
                          <span className="w-20 text-sm font-medium">{company.formattedTicker || company.ticker}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                            <div
                              className={`h-full ${changePercent >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(changePercent) * 10}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
            
            {activeView === 'directors' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Director Analysis</h2>
                <div className="space-y-4">
                  {companies
                    .filter(c => (selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker)) && c.directors.length > 0)
                    .slice(0, 5)
                    .map(company => (
                      <div key={company.ticker} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-semibold">{company.company}</h3>
                          <span className="text-sm text-gray-500">{company.directors.length} directors</span>
                        </div>
                        <div className="space-y-1">
                          {company.directors.slice(0, 3).map((director, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{director.name}</span>
                              <span className="text-gray-600">{director.position}</span>
                            </div>
                          ))}
                          {company.directors.length > 3 && (
                            <p className="text-sm text-gray-500">+{company.directors.length - 3} more</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}