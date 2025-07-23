import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Building2, Users, Network, LineChart, PieChart, RefreshCw } from 'lucide-react';
import { SecureGoogleSheetsService, type SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';

// Virtual list component for performance
const VirtualList = ({ items, height, itemHeight, renderItem, selectedIds, onToggleSelect }: {
  items: SecureIBEXCompanyData[];
  height: number;
  itemHeight: number;
  renderItem: (item: SecureIBEXCompanyData, isSelected: boolean, onToggle: () => void) => React.ReactNode;
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(height / itemHeight) + 1, items.length);
  const visibleItems = items.slice(startIndex, endIndex);
  const invisibleItemsHeight = startIndex * itemHeight;
  
  return (
    <div
      ref={scrollElementRef}
      className="overflow-auto"
      style={{ height }}
      onScroll={(e) => setScrollTop((e.target as HTMLDivElement).scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${invisibleItemsHeight}px)` }}>
          {visibleItems.map((item) => (
            <div key={item.ticker} style={{ height: itemHeight }}>
              {renderItem(item, selectedIds.has(item.ticker), () => onToggleSelect(item.ticker))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Company row component
const CompanyRow = React.memo(({ company, isSelected, onToggle }: {
  company: SecureIBEXCompanyData;
  isSelected: boolean;
  onToggle: () => void;
}) => {
  const mockChange = useMemo(() => SecureGoogleSheetsService.calculateMockChange(), []);
  
  return (
    <div
      className={`flex items-center p-3 border-b cursor-pointer transition-colors ${
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      }`}
      onClick={onToggle}
    >
      <input
        type="checkbox"
        checked={isSelected}
        readOnly
        className="mr-3"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{company.formattedTicker}</span>
            <span className="ml-2 text-sm text-gray-600">{company.company}</span>
          </div>
          <div className="text-right">
            <div className="font-medium">€{company.currentPriceEur.toFixed(2)}</div>
            <div className={`text-sm ${mockChange.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {mockChange.changePercent >= 0 ? '+' : ''}{mockChange.changePercent.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 flex justify-between">
          <span>{company.sector}</span>
          <span>{company.directors.length} directors</span>
        </div>
      </div>
    </div>
  );
});

// Network visualization component
const NetworkVisualization = ({ companies, selectedCompanyIds }: {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Filter data based on selection
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies.slice(0, 10); // Show top 10 if none selected
    
    if (relevantCompanies.length === 0) return;
    
    // Simple force-directed layout simulation
    const nodes = relevantCompanies.map((company, i) => ({
      id: company.ticker,
      x: width / 2 + Math.cos(i * 2 * Math.PI / relevantCompanies.length) * 150,
      y: height / 2 + Math.sin(i * 2 * Math.PI / relevantCompanies.length) * 150,
      label: company.formattedTicker,
      type: 'company' as const,
      directorCount: company.directors.length
    }));
    
    // Draw connections based on shared directors
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const company1 = relevantCompanies[i];
        const company2 = relevantCompanies[j];
        
        // Check for shared directors
        const sharedDirectors = company1.directors.filter(d1 =>
          company2.directors.some(d2 => d1.name === d2.name)
        );
        
        if (sharedDirectors.length > 0) {
          ctx.strokeStyle = '#3b82f6';
          ctx.lineWidth = Math.min(sharedDirectors.length * 2, 6);
        } else if (Math.random() > 0.8) { // Some random connections for demo
          ctx.strokeStyle = '#e5e7eb';
          ctx.lineWidth = 1;
        } else {
          continue;
        }
        
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }
    }
    
    // Draw nodes
    nodes.forEach(node => {
      const radius = Math.max(15, Math.min(30, node.directorCount * 3));
      
      ctx.fillStyle = selectedCompanyIds.has(node.id) ? '#1d4ed8' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Add label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });
  }, [companies, selectedCompanyIds]);
  
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={400} 
        className="max-w-full max-h-full"
      />
    </div>
  );
};

// Main enhanced dashboard component
export function EnhancedDashboard() {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'network' | 'sectors' | 'performance' | 'directors'>('network');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>('');

  // Load initial data
  useEffect(() => {
    fetchData();
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
      company.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.formattedTicker.toLowerCase().includes(searchQuery.toLowerCase())
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
      totalMarketCap: selected.reduce((sum, c) => sum + c.marketCapEur, 0),
      avgPrice: selected.reduce((sum, c) => sum + c.currentPriceEur, 0) / selected.length,
      totalVolume: selected.reduce((sum, c) => sum + c.volumeEur, 0),
      totalDirectors: selected.reduce((sum, c) => sum + c.directors.length, 0)
    };
  }, [companies, selectedCompanyIds]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900">Loading IBEX 35 Intelligence...</h2>
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
    <div className="h-screen flex bg-gray-50">
      {/* Left Panel - Company List */}
      <div className="w-96 bg-white border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold">IBEX 35 Intelligence</h1>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
            <div className="text-xs text-gray-500 flex items-center">
              D1 Database • {companies.length} companies
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
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Selection info */}
          {selectedCompanyIds.size > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-gray-600">{selectedCompanyIds.size} companies selected</span>
              <button
                onClick={clearSelection}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
        
        {/* Company list with virtual scrolling */}
        <div className="flex-1">
          <VirtualList
            items={filteredCompanies}
            height={window.innerHeight - 220}
            itemHeight={80}
            renderItem={(company, isSelected, onToggle) => (
              <CompanyRow
                company={company}
                isSelected={isSelected}
                onToggle={onToggle}
              />
            )}
            selectedIds={selectedCompanyIds}
            onToggleSelect={toggleCompanySelection}
          />
        </div>
      </div>
      
      {/* Right Panel - Visualizations */}
      <div className="flex-1 flex flex-col">
        {/* Metrics Bar */}
        <div className="bg-white border-b p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-gray-600">Market Cap</div>
              <div className="text-xl font-bold">€{(metrics.totalMarketCap / 1e9).toFixed(1)}B</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Price</div>
              <div className="text-xl font-bold">€{metrics.avgPrice.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Volume</div>
              <div className="text-xl font-bold">€{(metrics.totalVolume / 1e6).toFixed(1)}M</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Directors</div>
              <div className="text-xl font-bold">{metrics.totalDirectors}</div>
            </div>
          </div>
        </div>
        
        {/* View Selector */}
        <div className="bg-white border-b p-2">
          <div className="flex gap-2">
            {[
              { id: 'network', label: 'Network', icon: Network },
              { id: 'sectors', label: 'Sectors', icon: PieChart },
              { id: 'performance', label: 'Performance', icon: LineChart },
              { id: 'directors', label: 'Directors', icon: Users },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveView(tab.id as any)}
                  className={`px-4 py-2 rounded flex items-center gap-2 ${
                    activeView === tab.id ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.label}
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
                <NetworkVisualization
                  companies={companies}
                  selectedCompanyIds={selectedCompanyIds}
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
                      const mockChange = SecureGoogleSheetsService.calculateMockChange();
                      return (
                        <div key={company.ticker} className="flex items-center gap-4">
                          <span className="w-20 text-sm font-medium">{company.formattedTicker}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                            <div
                              className={`h-full ${mockChange.changePercent >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{ width: `${Math.abs(mockChange.changePercent) * 10}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${mockChange.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {mockChange.changePercent >= 0 ? '+' : ''}{mockChange.changePercent.toFixed(2)}%
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