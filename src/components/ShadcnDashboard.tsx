import { useState, useMemo, useCallback, useEffect } from 'react';
import { Search, Building2, Users, Network, LineChart, PieChart, RefreshCw, Sparkles, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { SecureGoogleSheetsService, type SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SimpleNetworkGraph } from './enhanced/SimpleNetworkGraph';
import { cn } from '@/lib/utils';

const sectorIcons: Record<string, string> = {
  'Financial Services': '🏦',
  'Energy': '⚡',
  'Telecommunications': '📡',
  'Utilities': '🔧',
  'Infrastructure': '🏗️',
  'Tourism': '✈️',
  'Textile': '👕',
  'Steel': '⚙️',
  'Aviation': '🛩️',
  'Technology': '💻',
  'Industrial': '🏭',
  'Consumer': '🛒',
  'Real Estate': '🏢'
};

const getSectorIcon = (sector: string): string => {
  return sectorIcons[sector] || '🏢';
};

const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e12) return `€${(marketCap / 1e12).toFixed(1)}T`;
  if (marketCap >= 1e9) return `€${(marketCap / 1e9).toFixed(1)}B`;
  if (marketCap >= 1e6) return `€${(marketCap / 1e6).toFixed(1)}M`;
  return `€${marketCap.toFixed(0)}`;
};

const formatVolume = (volume: number): string => {
  if (volume >= 1e9) return `€${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `€${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `€${(volume / 1e3).toFixed(1)}K`;
  return `€${volume.toFixed(0)}`;
};

interface CompanyCardProps {
  company: SecureIBEXCompanyData;
  isSelected: boolean;
  onToggle: () => void;
}

function CompanyCard({ company, isSelected, onToggle }: CompanyCardProps) {
  const mockChange = useMemo(() => SecureGoogleSheetsService.calculateMockChange(), []);
  const isPositive = mockChange.changePercent >= 0;

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onToggle}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="text-lg">{getSectorIcon(company.sector)}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{company.formattedTicker || company.ticker}</CardTitle>
              <CardDescription>{company.sector}</CardDescription>
            </div>
          </div>
          <div className={cn(
            "w-4 h-4 rounded-full border-2 transition-all",
            isSelected ? "bg-primary border-primary" : "border-muted-foreground"
          )} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-foreground mb-2 line-clamp-2">
            {company.company}
          </h4>
        </div>

        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">
                {SecureGoogleSheetsService.safeCurrency(company.currentPriceEur)}
              </p>
              <p className="text-sm text-muted-foreground">Current Price</p>
            </div>
            <Badge variant={isPositive ? "default" : "destructive"} className="gap-1">
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {isPositive ? '+' : ''}{mockChange.changePercent.toFixed(2)}%
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800 dark:text-blue-400">Market Cap</span>
            </div>
            <p className="font-bold text-blue-900 dark:text-blue-100">{formatMarketCap(company.marketCapEur || 0)}</p>
          </div>
          
          <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <PieChart className="w-4 h-4 text-purple-600" />
              <span className="text-xs font-medium text-purple-800 dark:text-purple-400">Volume</span>
            </div>
            <p className="font-bold text-purple-900 dark:text-purple-100">{formatVolume(company.volumeEur || 0)}</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800 dark:text-amber-400">Board Members</span>
            </div>
            <span className="font-bold text-amber-900 dark:text-amber-100">{company.directors.length}</span>
          </div>
          
          {company.directors.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Key: {company.directors.slice(0, 2).map(d => d.name.split(' ')[0]).join(', ')}
                {company.directors.length > 2 && ` +${company.directors.length - 2} more`}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ShadcnDashboard() {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'network' | 'sectors' | 'performance' | 'directors'>('network');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>('');

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
        await fetchData();
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Loading IBEX 35 Intelligence...</h2>
            <p className="text-muted-foreground">Preparing your advanced dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <CardTitle>Connection Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchData} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex bg-background">
      {/* Left Panel */}
      <div className="w-96 border-r bg-card flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary rounded-xl">
              <Building2 className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">IBEX 35 Intelligence</h1>
              <p className="text-sm text-muted-foreground">Advanced Corporate Analysis</p>
            </div>
          </div>
          
          {/* Controls */}
          <div className="flex gap-2 mb-4">
            <Button 
              onClick={handleSync}
              disabled={syncing}
              size="sm"
              className="gap-2"
            >
              <RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />
              {syncing ? 'Syncing...' : 'Sync Data'}
            </Button>
            <Badge variant="outline" className="gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              D1 Database • {companies.length} companies
            </Badge>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {/* Selection info */}
          {selectedCompanyIds.size > 0 && (
            <Card className="mt-3">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedCompanyIds.size} companies selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear all
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Company Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredCompanies.map((company) => (
            <CompanyCard
              key={company.ticker}
              company={company}
              isSelected={selectedCompanyIds.has(company.ticker)}
              onToggle={() => toggleCompanySelection(company.ticker)}
            />
          ))}
          
          {filteredCompanies.length === 0 && (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              <div className="text-center">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No companies found</p>
                <p className="text-sm">Try adjusting your search</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {/* Metrics Bar */}
        <div className="border-b bg-card p-6">
          <div className="grid grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-blue-500 rounded-md">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-800">Market Cap</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">€{((metrics.totalMarketCap || 0) / 1e9).toFixed(1)}B</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-green-500 rounded-md">
                    <LineChart className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-green-800">Avg Price</span>
                </div>
                <div className="text-2xl font-bold text-green-900">€{(metrics.avgPrice || 0).toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-purple-500 rounded-md">
                    <PieChart className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-purple-800">Total Volume</span>
                </div>
                <div className="text-2xl font-bold text-purple-900">€{((metrics.totalVolume || 0) / 1e6).toFixed(1)}M</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1 bg-amber-500 rounded-md">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-amber-800">Directors</span>
                </div>
                <div className="text-2xl font-bold text-amber-900">{metrics.totalDirectors}</div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* View Selector */}
        <div className="border-b bg-card p-4">
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
                <Button
                  key={tab.id}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => setActiveView(tab.id as any)}
                  className="gap-3"
                >
                  <IconComponent className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium text-sm">{tab.label}</div>
                    <div className="text-xs opacity-80">{tab.description}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
        
        {/* Visualization Area */}
        <div className="flex-1 p-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>
                {activeView === 'network' && 'Company & Director Network'}
                {activeView === 'sectors' && 'Sector Distribution'}
                {activeView === 'performance' && 'Performance Overview'}
                {activeView === 'directors' && 'Director Analysis'}
              </CardTitle>
            </CardHeader>
            <CardContent className="h-full">
              {activeView === 'network' && (
                <SimpleNetworkGraph
                  companies={companies}
                  selectedCompanyIds={selectedCompanyIds}
                  width={800}
                  height={500}
                />
              )}
              
              {activeView === 'sectors' && (
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(
                    companies
                      .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker))
                      .reduce((acc, company) => {
                        acc[company.sector] = (acc[company.sector] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                  ).map(([sector, count]) => (
                    <Card key={sector}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <span>{sector}</span>
                          <Badge>{count}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
              
              {activeView === 'performance' && (
                <div className="space-y-4">
                  {companies
                    .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker))
                    .sort((a, b) => b.marketCapEur - a.marketCapEur)
                    .slice(0, 10)
                    .map(company => {
                      const mockChange = SecureGoogleSheetsService.calculateMockChange();
                      return (
                        <Card key={company.ticker}>
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <span className="w-20 text-sm font-medium">{company.formattedTicker || company.ticker}</span>
                              <div className="flex-1 bg-muted rounded-full h-6 relative overflow-hidden">
                                <div
                                  className={cn(
                                    "h-full transition-all",
                                    mockChange.changePercent >= 0 ? "bg-green-500" : "bg-red-500"
                                  )}
                                  style={{ width: `${Math.abs(mockChange.changePercent) * 10}%` }}
                                />
                              </div>
                              <Badge variant={mockChange.changePercent >= 0 ? "default" : "destructive"}>
                                {mockChange.changePercent >= 0 ? '+' : ''}{mockChange.changePercent.toFixed(2)}%
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              )}
              
              {activeView === 'directors' && (
                <div className="space-y-4">
                  {companies
                    .filter(c => (selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker)) && c.directors.length > 0)
                    .slice(0, 5)
                    .map(company => (
                      <Card key={company.ticker}>
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg">{company.company}</CardTitle>
                            <Badge>{company.directors.length} directors</Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {company.directors.slice(0, 3).map((director, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{director.name}</span>
                                <span className="text-muted-foreground">{director.position}</span>
                              </div>
                            ))}
                            {company.directors.length > 3 && (
                              <p className="text-sm text-muted-foreground">+{company.directors.length - 3} more</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}