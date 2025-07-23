import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, Building2, Users, TrendingUp, Network, Filter, ChevronRight, X, LineChart, PieChart, BarChart3 } from 'lucide-react';

// Mock data generator
const generateMockData = () => {
  const sectors = ['Banking', 'Energy', 'Telecommunications', 'Utilities', 'Real Estate', 'Technology', 'Consumer', 'Industrial'];
  const companies = [];
  const directors = [];
  
  // Generate companies
  for (let i = 0; i < 35; i++) {
    companies.push({
      id: `company-${i}`,
      ticker: `IBX${i.toString().padStart(3, '0')}`,
      name: `Company ${i + 1} S.A.`,
      sector: sectors[i % sectors.length],
      price: 20 + Math.random() * 180,
      marketCap: (5 + Math.random() * 95) * 1e9,
      volume: (1 + Math.random() * 10) * 1e6,
      change: (Math.random() - 0.5) * 10,
      pe: 10 + Math.random() * 30,
      dividend: Math.random() * 5
    });
  }
  
  // Generate directors with cross-company relationships
  for (let i = 0; i < 150; i++) {
    const numPositions = 1 + Math.floor(Math.random() * 4);
    const positions = [];
    
    for (let j = 0; j < numPositions; j++) {
      positions.push({
        companyId: companies[Math.floor(Math.random() * companies.length)].id,
        role: ['CEO', 'CFO', 'Board Member', 'Independent Director'][Math.floor(Math.random() * 4)]
      });
    }
    
    directors.push({
      id: `director-${i}`,
      name: `Director ${i + 1}`,
      positions
    });
  }
  
  return { companies, directors };
};

// Virtual list component for performance
const VirtualList = ({ items, height, itemHeight, renderItem, selectedIds, onToggleSelect }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef(null);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + Math.ceil(height / itemHeight) + 1, items.length);
  const visibleItems = items.slice(startIndex, endIndex);
  const invisibleItemsHeight = startIndex * itemHeight;
  
  return (
    <div
      ref={scrollElementRef}
      className="overflow-auto"
      style={{ height }}
      onScroll={(e) => setScrollTop(e.target.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${invisibleItemsHeight}px)` }}>
          {visibleItems.map((item) => (
            <div key={item.id} style={{ height: itemHeight }}>
              {renderItem(item, selectedIds.has(item.id), () => onToggleSelect(item.id))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Company row component
const CompanyRow = React.memo(({ company, isSelected, onToggle }) => {
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
        onChange={() => {}}
        className="mr-3"
      />
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-medium">{company.ticker}</span>
            <span className="ml-2 text-sm text-gray-600">{company.name}</span>
          </div>
          <div className="text-right">
            <div className="font-medium">€{company.price.toFixed(2)}</div>
            <div className={`text-sm ${company.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {company.change >= 0 ? '+' : ''}{company.change.toFixed(2)}%
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1">{company.sector}</div>
      </div>
    </div>
  );
});

// Network visualization component
const NetworkVisualization = ({ companies, directors, selectedCompanyIds }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Filter data based on selection
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.id))
      : companies.slice(0, 10); // Show top 10 if none selected
    
    // Simple force-directed layout simulation
    const nodes = relevantCompanies.map((company, i) => ({
      id: company.id,
      x: width / 2 + Math.cos(i * 2 * Math.PI / relevantCompanies.length) * 150,
      y: height / 2 + Math.sin(i * 2 * Math.PI / relevantCompanies.length) * 150,
      label: company.ticker,
      type: 'company'
    }));
    
    // Draw connections (simplified - would be based on actual director relationships)
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (Math.random() > 0.7) { // Random connections for demo
          ctx.beginPath();
          ctx.moveTo(nodes[i].x, nodes[i].y);
          ctx.lineTo(nodes[j].x, nodes[j].y);
          ctx.stroke();
        }
      }
    }
    
    // Draw nodes
    nodes.forEach(node => {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fill();
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y);
    });
  }, [companies, directors, selectedCompanyIds]);
  
  return (
    <canvas 
      ref={canvasRef} 
      width={600} 
      height={400} 
      className="w-full h-full"
    />
  );
};

// Main dashboard component
export default function IBEX35Dashboard() {
  const { companies, directors } = useMemo(() => generateMockData(), []);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('network');
  
  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.ticker.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);
  
  const toggleCompanySelection = useCallback((companyId) => {
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
      ? companies.filter(c => selectedCompanyIds.has(c.id))
      : companies;
    
    return {
      totalMarketCap: selected.reduce((sum, c) => sum + c.marketCap, 0),
      avgPE: selected.reduce((sum, c) => sum + c.pe, 0) / selected.length,
      totalVolume: selected.reduce((sum, c) => sum + c.volume, 0),
      avgDividend: selected.reduce((sum, c) => sum + c.dividend, 0) / selected.length
    };
  }, [companies, selectedCompanyIds]);
  
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
            height={window.innerHeight - 180}
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
              <div className="text-sm text-gray-600">Avg P/E Ratio</div>
              <div className="text-xl font-bold">{metrics.avgPE.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Volume</div>
              <div className="text-xl font-bold">€{(metrics.totalVolume / 1e6).toFixed(1)}M</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Dividend</div>
              <div className="text-xl font-bold">{metrics.avgDividend.toFixed(2)}%</div>
            </div>
          </div>
        </div>
        
        {/* View Selector */}
        <div className="bg-white border-b p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveView('network')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeView === 'network' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <Network className="w-4 h-4" />
              Network
            </button>
            <button
              onClick={() => setActiveView('sectors')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeView === 'sectors' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <PieChart className="w-4 h-4" />
              Sectors
            </button>
            <button
              onClick={() => setActiveView('performance')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeView === 'performance' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <LineChart className="w-4 h-4" />
              Performance
            </button>
            <button
              onClick={() => setActiveView('directors')}
              className={`px-4 py-2 rounded flex items-center gap-2 ${
                activeView === 'directors' ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
              }`}
            >
              <Users className="w-4 h-4" />
              Directors
            </button>
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
                  directors={directors}
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
                      .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.id))
                      .reduce((acc, company) => {
                        acc[company.sector] = (acc[company.sector] || 0) + 1;
                        return acc;
                      }, {})
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
                    .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.id))
                    .sort((a, b) => b.change - a.change)
                    .slice(0, 10)
                    .map(company => (
                      <div key={company.id} className="flex items-center gap-4">
                        <span className="w-20 text-sm font-medium">{company.ticker}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                          <div
                            className={`h-full ${company.change >= 0 ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ width: `${Math.abs(company.change) * 10}%` }}
                          />
                        </div>
                        <span className={`text-sm font-medium ${company.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {company.change >= 0 ? '+' : ''}{company.change.toFixed(2)}%
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
            
            {activeView === 'directors' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Director Connections</h2>
                <div className="text-gray-600">
                  <p>This view would show:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Directors serving on multiple boards</li>
                    <li>Cross-company relationships</li>
                    <li>Board composition analysis</li>
                    <li>Director background and expertise</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}