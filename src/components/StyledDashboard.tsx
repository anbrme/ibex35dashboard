import { useState, useMemo, useCallback, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { Search, Building2, Users, Network, LineChart, PieChart, RefreshCw, Sparkles, BarChart3, TrendingUp, DollarSign, ArrowUp, ArrowDown, Percent, ChevronLeft, ChevronRight } from 'lucide-react';
import { SecureGoogleSheetsService, type SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';
import { CytoscapeNetworkGraph } from './enhanced/CytoscapeNetworkGraph';
import { NetworkAnalyticsDashboard } from './enhanced/NetworkAnalyticsDashboard';
import { networkAnalyticsService } from '../services/networkAnalytics';
import { DirectorsAnalysisPanel } from './DirectorsAnalysisPanel';
import { ShareholdersAnalysisPanel } from './ShareholdersAnalysisPanel';
import { ComprehensiveInsights } from './insights/ComprehensiveInsights';

// Global styles
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    padding: 0;
    font-family: 'Inter', sans-serif;
    background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
    min-height: 100vh;
  }
`;

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Styled components
const Container = styled.div<{ $panelVisible: boolean }>`
  height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
  transition: all 0.3s ease;
  overflow: hidden;
`;

const LeftPanel = styled.div<{ $isVisible: boolean; $isFullscreen: boolean }>`
  width: ${props => props.$isVisible ? '400px' : '0px'};
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  box-shadow: ${props => props.$isVisible ? '20px 0 40px rgba(0, 0, 0, 0.1)' : 'none'};
  min-height: 100vh;
  overflow: hidden;
  transition: all 0.3s ease;
  opacity: ${props => props.$isVisible ? 1 : 0};
  flex-shrink: 0;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const HeaderTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const IconWrapper = styled.div`
  padding: 12px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const Button = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'variant'
})<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    
    &:hover {
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.4);
      transform: translateY(-2px);
    }
  ` : `
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.2);
    
    &:hover {
      background: rgba(59, 130, 246, 0.2);
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Badge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 8px;
  font-size: 12px;
  color: #065f46;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  background: #10b981;
  border-radius: 50%;
  animation: ${pulse} 2s infinite;
`;

const SearchWrapper = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const SelectionInfo = styled.div`
  margin-top: 12px;
  padding: 12px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CompanyList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
`;

const CompanyCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isSelected'
})<{ isSelected: boolean }>`
  background: ${props => props.isSelected ? 
    'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1))' : 
    'rgba(255, 255, 255, 0.8)'};
  border: 2px solid ${props => props.isSelected ? '#3b82f6' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
    border-color: #3b82f6;
  }
`;

const CompanyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const SectorIcon = styled.div`
  padding: 12px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 12px;
  font-size: 20px;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
`;

const CompanyDetails = styled.div``;

const CompanyTicker = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
`;

const CompanySector = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const SelectionIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isSelected'
})<{ isSelected: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.isSelected ? '#3b82f6' : '#d1d5db'};
  border-radius: 50%;
  background: ${props => props.isSelected ? '#3b82f6' : 'transparent'};
  position: relative;
  transition: all 0.2s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    opacity: ${props => props.isSelected ? 1 : 0};
    transition: opacity 0.2s ease;
  }
`;

const ExpandToggle = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
  margin: 0 0 12px 0;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.1);
  
  &:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.2);
  }
`;

const CollapsibleContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isExpanded'
})<{ isExpanded: boolean }>`
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${props => props.isExpanded ? `
    max-height: 1000px;
    opacity: 1;
    margin-top: 8px;
  ` : `
    max-height: 0;
    opacity: 0;
    margin-top: 0;
  `}
`;

const PriceSection = styled.div`
  background: linear-gradient(135deg, rgba(249, 250, 251, 0.8), rgba(243, 244, 246, 0.8));
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  backdrop-filter: blur(10px);
`;

const PriceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Price = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const PriceLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
`;


const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 16px;
`;

const MetricCard = styled.div<{ color: string }>`
  background: ${props => `linear-gradient(135deg, ${props.color}10, ${props.color}20)`};
  border: 1px solid ${props => `${props.color}30`};
  border-radius: 10px;
  padding: 10px;
`;

const MetricHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
`;

const MetricIcon = styled.div<{ color: string }>`
  color: ${props => props.color};
`;

const MetricLabel = styled.div<{ color: string }>`
  font-size: 12px;
  font-weight: 500;
  color: ${props => props.color};
`;

const MetricValue = styled.div<{ color: string }>`
  font-size: 14px;
  font-weight: 700;
  color: ${props => props.color};
`;

const DirectorsSection = styled.div`
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(217, 119, 6, 0.1));
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: 12px;
  padding: 12px;
`;

const DirectorsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: between;
  margin-bottom: 8px;
`;

const DirectorsCount = styled.div`
  font-size: 16px;
  font-weight: 700;
  color: #92400e;
  margin-left: auto;
`;

const DirectorsPreview = styled.div`
  font-size: 12px;
  color: #78350f;
`;

const RightPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
`;

const PanelToggle = styled.button<{ $isVisible: boolean }>`
  position: fixed;
  top: 50%;
  left: ${props => props.$isVisible ? '404px' : '4px'};
  transform: translateY(-50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: ${props => props.$isVisible ? '0 12px 12px 0' : '0 8px 8px 0'};
  padding: ${props => props.$isVisible ? '12px' : '8px 6px'};
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  writing-mode: ${props => props.$isVisible ? 'horizontal-tb' : 'vertical-lr'};
  text-orientation: ${props => props.$isVisible ? 'mixed' : 'mixed'};
  font-weight: 500;
  color: #374151;
  
  &:hover {
    background: rgba(255, 255, 255, 1);
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  }
`;

const CompanyCounter = styled.div<{ $isVisible: boolean }>`
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 1000;
  background: rgba(59, 130, 246, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 8px 16px;
  color: white;
  font-weight: 600;
  font-size: 14px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  opacity: ${props => props.$isVisible ? 1 : 0};
  visibility: ${props => props.$isVisible ? 'visible' : 'hidden'};
  transform: ${props => props.$isVisible ? 'translateY(0)' : 'translateY(-10px)'};
`;

const MetricsBar = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 16px 24px;
  flex-shrink: 0;
`;

const MetricsBarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
`;

const MetricsBarCard = styled.div<{ color: string }>`
  background: ${props => `linear-gradient(135deg, ${props.color}10, ${props.color}20)`};
  border: 1px solid ${props => `${props.color}30`};
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
`;

const ViewSelector = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 12px 24px;
  flex-shrink: 0;
`;

const ViewTabs = styled.div`
  display: flex;
  gap: 12px;
`;

const ViewTab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'isActive'
})<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  ${props => props.isActive ? `
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  ` : `
    background: rgba(255, 255, 255, 0.8);
    color: #6b7280;
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
  `}
`;

const TabInfo = styled.div`
  text-align: left;
`;

const TabLabel = styled.div`
  font-weight: 600;
`;

const TabDescription = styled.div`
  font-size: 12px;
  opacity: 0.8;
`;

const VisualizationArea = styled.div`
  flex: 1;
  padding: 16px 24px 8px 24px;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

const VisualizationCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 20px;
  flex: 1;
  min-height: 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
`;

const VisualizationTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 24px 0;
  flex-shrink: 0;
`;

const TitleRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-shrink: 0;
`;

const AnalyticsToggle = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${props => props.isActive ? '#3b82f6' : '#f3f4f6'};
  color: ${props => props.isActive ? 'white' : '#374151'};
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: ${props => props.isActive ? '#2563eb' : '#e5e7eb'};
  }
`;

const VisualizationContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
`;

const LoadingContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
`;

const LoadingContent = styled.div`
  text-align: center;
  color: white;
`;

const LoadingSpinner = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
`;

const SpinnerRing = styled.div`
  width: 64px;
  height: 64px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

const SpinnerIcon = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: ${pulse} 2s infinite;
`;

const LoadingTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
`;

const LoadingSubtitle = styled.p`
  font-size: 16px;
  opacity: 0.8;
  margin: 0;
`;

const ErrorContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
`;

const ErrorCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 40px;
  text-align: center;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
`;

const ErrorIcon = styled.div`
  font-size: 64px;
  margin-bottom: 16px;
`;

const ErrorTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const ErrorMessage = styled.p`
  font-size: 16px;
  color: #6b7280;
  margin: 0 0 24px 0;
`;

// Sector icons mapping
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

const formatPERatio = (pe: number | null | undefined): string => {
  return pe ? pe.toFixed(1) : 'N/A';
};

const formatEPS = (eps: number | null | undefined): string => {
  return eps ? `€${eps.toFixed(2)}` : 'N/A';
};

const formatPrice52 = (price: number | null | undefined): string => {
  return price ? `€${price.toFixed(2)}` : 'N/A';
};

const formatChangePercent = (percent: number | null | undefined): string => {
  if (!percent) return 'N/A';
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

export function StyledDashboard() {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [expandedCompanyIds, setExpandedCompanyIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<'network' | 'sectors' | 'performance' | 'directors' | 'shareholders' | 'insights'>('network');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string>('');
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [analyticsVisible, setAnalyticsVisible] = useState(true);

  // Calculate network analytics
  const networkAnalysis = useMemo(() => {
    const selectedCompanies = companies.filter(company => selectedCompanyIds.has(company.ticker));
    if (!selectedCompanies || selectedCompanies.length === 0) return null;
    return networkAnalyticsService.calculateNetworkMetrics(selectedCompanies);
  }, [companies, selectedCompanyIds]);

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
        // Auto-expand when selected
        setExpandedCompanyIds(expandedPrev => {
          const expandedNext = new Set(expandedPrev);
          expandedNext.add(companyId);
          return expandedNext;
        });
      }
      return next;
    });
  }, []);

  const toggleCompanyExpansion = useCallback((companyId: string) => {
    setExpandedCompanyIds(prev => {
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
  
  const selectAllCompanies = useCallback(() => {
    const allTickers = new Set(filteredCompanies.map(company => company.ticker));
    setSelectedCompanyIds(allTickers);
  }, [filteredCompanies]);
  
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
      <>
        <GlobalStyle />
        <LoadingContainer>
          <LoadingContent>
            <LoadingSpinner>
              <SpinnerRing />
              <SpinnerIcon>
                <Sparkles size={32} color="white" />
              </SpinnerIcon>
            </LoadingSpinner>
            <LoadingTitle>Loading IBEX 35 Intelligence...</LoadingTitle>
            <LoadingSubtitle>Preparing your advanced dashboard...</LoadingSubtitle>
          </LoadingContent>
        </LoadingContainer>
      </>
    );
  }

  if (error) {
    return (
      <>
        <GlobalStyle />
        <ErrorContainer>
          <ErrorCard>
            <ErrorIcon>⚠️</ErrorIcon>
            <ErrorTitle>Connection Error</ErrorTitle>
            <ErrorMessage>{error}</ErrorMessage>
            <Button variant="primary" onClick={fetchData}>
              Try Again
            </Button>
          </ErrorCard>
        </ErrorContainer>
      </>
    );
  }
  

  return (
    <>
      <GlobalStyle />
      <Container $panelVisible={isPanelVisible}>
        {/* Panel Toggle Button */}
        <PanelToggle 
          $isVisible={isPanelVisible}
          onClick={() => setIsPanelVisible(!isPanelVisible)}
        >
          {isPanelVisible ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          {isPanelVisible ? 'Hide Panel' : 'Show Companies'}
        </PanelToggle>

        {/* Company Counter (visible when panel is hidden) */}
        <CompanyCounter $isVisible={!isPanelVisible && selectedCompanyIds.size > 0}>
          {selectedCompanyIds.size} companies selected
        </CompanyCounter>

        {/* Left Panel */}
        <LeftPanel $isVisible={isPanelVisible} $isFullscreen={false}>
          <Header>
            <HeaderTitle>
              <IconWrapper>
                <Building2 size={24} color="white" />
              </IconWrapper>
              <div>
                <Title>IBEX 35 Intelligence</Title>
                <Subtitle>Advanced Corporate Analysis</Subtitle>
              </div>
            </HeaderTitle>
            
            <Controls>
              <Button 
                variant="primary"
                onClick={handleSync}
                disabled={syncing}
              >
                <RefreshCw size={16} style={{ animation: syncing ? `${spin} 1s linear infinite` : 'none' }} />
                {syncing ? 'Syncing...' : 'Sync Data'}
              </Button>
              <Badge>
                <StatusDot />
                D1 Database • {companies.length} companies
              </Badge>
            </Controls>
            
            <SearchWrapper>
              <SearchIcon>
                <Search size={16} />
              </SearchIcon>
              <SearchInput
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </SearchWrapper>
            
            <SelectionInfo>
              {selectedCompanyIds.size > 0 ? (
                <>
                  <span>{selectedCompanyIds.size} companies selected</span>
                  <Button variant="secondary" onClick={clearSelection}>
                    Clear all
                  </Button>
                </>
              ) : (
                <>
                  <span>{filteredCompanies.length} companies available</span>
                  <Button variant="primary" onClick={selectAllCompanies}>
                    Select all
                  </Button>
                </>
              )}
            </SelectionInfo>
          </Header>
          
          <CompanyList>
            {filteredCompanies.map((company) => {
              const isSelected = selectedCompanyIds.has(company.ticker);
              const isExpanded = expandedCompanyIds.has(company.ticker);
              
              return (
                <CompanyCard
                  key={company.ticker}
                  isSelected={isSelected}
                  onClick={() => toggleCompanySelection(company.ticker)}
                >
                  <CompanyHeader>
                    <CompanyInfo>
                      <SectorIcon>{getSectorIcon(company.sector)}</SectorIcon>
                      <CompanyDetails>
                        <CompanyTicker>{company.company}</CompanyTicker>
                        <CompanySector>{company.formattedTicker || company.ticker}</CompanySector>
                      </CompanyDetails>
                    </CompanyInfo>
                    <SelectionIndicator isSelected={isSelected} />
                  </CompanyHeader>

                  <ExpandToggle 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompanyExpansion(company.ticker);
                    }}
                  >
                    {isExpanded ? '▲ Hide Details' : '▼ Show Details'}
                  </ExpandToggle>

                  <PriceSection>
                    <PriceHeader>
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <Price>{SecureGoogleSheetsService.safeCurrency(company.currentPriceEur)}</Price>
                        <PriceLabel>Current Price</PriceLabel>
                      </div>
                    </PriceHeader>
                  </PriceSection>

                  <CollapsibleContent isExpanded={isExpanded}>

                  <MetricsGrid>
                    <MetricCard color="#3b82f6">
                      <MetricHeader>
                        <MetricIcon color="#3b82f6"><BarChart3 size={14} /></MetricIcon>
                        <MetricLabel color="#3b82f6">Market Cap</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#3b82f6">{formatMarketCap(company.marketCapEur || 0)}</MetricValue>
                    </MetricCard>
                    
                    <MetricCard color="#8b5cf6">
                      <MetricHeader>
                        <MetricIcon color="#8b5cf6"><PieChart size={14} /></MetricIcon>
                        <MetricLabel color="#8b5cf6">Volume</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#8b5cf6">{formatVolume(company.volumeEur || 0)}</MetricValue>
                    </MetricCard>

                    <MetricCard color="#10b981">
                      <MetricHeader>
                        <MetricIcon color="#10b981"><TrendingUp size={14} /></MetricIcon>
                        <MetricLabel color="#10b981">P/E Ratio</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#10b981">{formatPERatio(company.peRatio)}</MetricValue>
                    </MetricCard>
                    
                    <MetricCard color="#f59e0b">
                      <MetricHeader>
                        <MetricIcon color="#f59e0b"><DollarSign size={14} /></MetricIcon>
                        <MetricLabel color="#f59e0b">EPS</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#f59e0b">{formatEPS(company.eps)}</MetricValue>
                    </MetricCard>

                    <MetricCard color="#ef4444">
                      <MetricHeader>
                        <MetricIcon color="#ef4444"><ArrowUp size={14} /></MetricIcon>
                        <MetricLabel color="#ef4444">52W High</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#ef4444">{formatPrice52(company.high52)}</MetricValue>
                    </MetricCard>
                    
                    <MetricCard color="#6366f1">
                      <MetricHeader>
                        <MetricIcon color="#6366f1"><ArrowDown size={14} /></MetricIcon>
                        <MetricLabel color="#6366f1">52W Low</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#6366f1">{formatPrice52(company.low52)}</MetricValue>
                    </MetricCard>

                    <MetricCard color="#ec4899">
                      <MetricHeader>
                        <MetricIcon color="#ec4899"><Percent size={14} /></MetricIcon>
                        <MetricLabel color="#ec4899">Change %</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#ec4899">{formatChangePercent(company.changePercent)}</MetricValue>
                    </MetricCard>
                    
                    <MetricCard color="#06b6d4">
                      <MetricHeader>
                        <MetricIcon color="#06b6d4"><DollarSign size={14} /></MetricIcon>
                        <MetricLabel color="#06b6d4">Price Change</MetricLabel>
                      </MetricHeader>
                      <MetricValue color="#06b6d4">{formatPrice52(company.priceChange)}</MetricValue>
                    </MetricCard>
                  </MetricsGrid>

                  <DirectorsSection>
                    <DirectorsHeader>
                      <MetricHeader>
                        <MetricIcon color="#f59e0b"><Users size={16} /></MetricIcon>
                        <MetricLabel color="#f59e0b">Board Members</MetricLabel>
                      </MetricHeader>
                      <DirectorsCount>{company.directors.length}</DirectorsCount>
                    </DirectorsHeader>
                    
                    {company.directors.length > 0 && (
                      <DirectorsPreview>
                        Key: {company.directors.slice(0, 2).map(d => d.name.split(' ')[0]).join(', ')}
                        {company.directors.length > 2 && ` +${company.directors.length - 2} more`}
                      </DirectorsPreview>
                    )}
                  </DirectorsSection>
                  </CollapsibleContent>
                </CompanyCard>
              );
            })}
            
            {filteredCompanies.length === 0 && (
              <div style={{ textAlign: 'center', padding: '64px 0', color: '#6b7280' }}>
                <Search size={48} style={{ opacity: 0.5, marginBottom: 12 }} />
                <p>No companies found</p>
                <p style={{ fontSize: 14 }}>Try adjusting your search</p>
              </div>
            )}
          </CompanyList>
        </LeftPanel>
        
        {/* Right Panel */}
        <RightPanel>
          {/* Metrics Bar */}
          <MetricsBar>
            <MetricsBarGrid>
              <MetricsBarCard color="#3b82f6">
                <MetricHeader>
                  <div style={{ padding: 4, background: '#3b82f6', borderRadius: 8 }}>
                    <BarChart3 size={16} color="white" />
                  </div>
                  <MetricLabel color="#3b82f6">Market Cap</MetricLabel>
                </MetricHeader>
                <MetricValue color="#3b82f6">€{((metrics.totalMarketCap || 0) / 1e9).toFixed(1)}B</MetricValue>
              </MetricsBarCard>
              <MetricsBarCard color="#10b981">
                <MetricHeader>
                  <div style={{ padding: 4, background: '#10b981', borderRadius: 8 }}>
                    <LineChart size={16} color="white" />
                  </div>
                  <MetricLabel color="#10b981">Avg Price</MetricLabel>
                </MetricHeader>
                <MetricValue color="#10b981">€{(metrics.avgPrice || 0).toFixed(2)}</MetricValue>
              </MetricsBarCard>
              <MetricsBarCard color="#8b5cf6">
                <MetricHeader>
                  <div style={{ padding: 4, background: '#8b5cf6', borderRadius: 8 }}>
                    <PieChart size={16} color="white" />
                  </div>
                  <MetricLabel color="#8b5cf6">Total Volume</MetricLabel>
                </MetricHeader>
                <MetricValue color="#8b5cf6">€{((metrics.totalVolume || 0) / 1e6).toFixed(1)}M</MetricValue>
              </MetricsBarCard>
              <MetricsBarCard color="#f59e0b">
                <MetricHeader>
                  <div style={{ padding: 4, background: '#f59e0b', borderRadius: 8 }}>
                    <Users size={16} color="white" />
                  </div>
                  <MetricLabel color="#f59e0b">Directors</MetricLabel>
                </MetricHeader>
                <MetricValue color="#f59e0b">{metrics.totalDirectors}</MetricValue>
              </MetricsBarCard>
            </MetricsBarGrid>
          </MetricsBar>
          
          {/* View Selector */}
          <ViewSelector>
            <ViewTabs>
              {[
                { id: 'network', label: 'Network', icon: Network, description: 'Interactive graph' },
                { id: 'sectors', label: 'Sectors', icon: PieChart, description: 'Market distribution' },
                { id: 'performance', label: 'Performance', icon: LineChart, description: 'Price analysis' },
                { id: 'directors', label: 'Directors', icon: Users, description: 'Board analysis' },
                { id: 'shareholders', label: 'Shareholders', icon: TrendingUp, description: 'Ownership structure' },
                { id: 'insights', label: 'Financial Insights', icon: BarChart3, description: 'Advanced analytics' },
              ].map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <ViewTab
                    key={tab.id}
                    isActive={isActive}
                    onClick={() => setActiveView(tab.id as 'network' | 'sectors' | 'performance' | 'directors' | 'insights')}
                  >
                    <IconComponent size={20} />
                    <TabInfo>
                      <TabLabel>{tab.label}</TabLabel>
                      <TabDescription>{tab.description}</TabDescription>
                    </TabInfo>
                  </ViewTab>
                );
              })}
            </ViewTabs>
          </ViewSelector>
          
          {/* Visualization Area */}
          <VisualizationArea>
            <VisualizationCard>
              <TitleRow>
                <VisualizationTitle style={{ margin: 0 }}>
                  {activeView === 'network' && 'Company & Director Network'}
                  {activeView === 'sectors' && 'Sector Distribution'}
                  {activeView === 'performance' && 'Performance Overview'}
                  {activeView === 'directors' && 'Director Analysis'}
                  {activeView === 'insights' && 'Financial Intelligence Dashboard'}
                </VisualizationTitle>
                {activeView === 'network' && selectedCompanyIds.size > 0 && (
                  <AnalyticsToggle 
                    isActive={analyticsVisible}
                    onClick={() => setAnalyticsVisible(!analyticsVisible)}
                  >
                    <BarChart3 size={16} />
                    Analytics
                  </AnalyticsToggle>
                )}
              </TitleRow>
              
              <VisualizationContent>
                {activeView === 'network' && (
                  <>
                    <CytoscapeNetworkGraph
                      companies={companies}
                      selectedCompanyIds={selectedCompanyIds}
                    />
                    <NetworkAnalyticsDashboard 
                      analysis={networkAnalysis}
                      isVisible={analyticsVisible && selectedCompanyIds.size > 0}
                    />
                  </>
                )}
                
                {activeView === 'sectors' && (
                  <div style={{ overflow: 'auto', minHeight: '400px' }}>
                    <MetricsGrid>
                      {Object.entries(
                        companies
                          .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker))
                          .reduce((acc, company) => {
                            acc[company.sector] = (acc[company.sector] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                      ).map(([sector, count]) => (
                        <MetricCard key={sector} color="#3b82f6">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>{sector}</span>
                            <Badge style={{ background: '#3b82f6', color: 'white', border: 'none' }}>{count}</Badge>
                          </div>
                        </MetricCard>
                      ))}
                    </MetricsGrid>
                  </div>
                )}
                
                {activeView === 'performance' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto', minHeight: '400px' }}>
                    {companies
                      .filter(c => selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker))
                      .sort((a, b) => b.marketCapEur - a.marketCapEur)
                      .slice(0, 10)
                      .map(company => {
                        return (
                          <MetricCard key={company.ticker} color="#3b82f6">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                              <span style={{ width: 100, fontSize: 14, fontWeight: 500 }}>
                                {company.formattedTicker || company.ticker}
                              </span>
                              <span style={{ flex: 1, fontSize: 14, color: '#4b5563' }}>
                                {company.company}
                              </span>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#3b82f6' }}>
                                {SecureGoogleSheetsService.safeCurrency(company.currentPriceEur)}
                              </span>
                            </div>
                          </MetricCard>
                        );
                      })}
                  </div>
                )}
                
                {activeView === 'directors' && <DirectorsAnalysisPanel companies={companies} selectedCompanyIds={selectedCompanyIds} />}
                
                {activeView === 'shareholders' && <ShareholdersAnalysisPanel companies={companies} selectedCompanyIds={selectedCompanyIds} />}
                
                {activeView === 'insights' && <ComprehensiveInsights companies={companies} selectedCompanyIds={selectedCompanyIds} />}
              </VisualizationContent>
            </VisualizationCard>
          </VisualizationArea>
        </RightPanel>
      </Container>
    </>
  );
}