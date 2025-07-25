import { useState, useMemo, useCallback, useEffect } from 'react';
import styled, { createGlobalStyle, keyframes } from 'styled-components';
import { Search, Building2, Users, Network, PieChart, RefreshCw, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { SecureGoogleSheetsService, type SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';
import { EChartsNetworkGraph } from './enhanced/EChartsNetworkGraph';
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

const slideDown = keyframes`
  from { height: 0; opacity: 0; }
  to { height: auto; opacity: 1; }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Main Container - Now vertical layout
const Container = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #1e3a8a 0%, #3730a3 50%, #581c87 100%);
`;

// Top Section for Company Selection
const TopSection = styled.div<{ isExpanded: boolean }>`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  max-height: ${props => props.isExpanded ? '70vh' : 'auto'};
  overflow: hidden;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const IconWrapper = styled.div`
  padding: 12px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 4px 0;
`;

const Subtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ToggleButton = styled.button<{ isExpanded: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: ${props => props.isExpanded ? '#3b82f6' : 'rgba(59, 130, 246, 0.1)'};
  color: ${props => props.isExpanded ? 'white' : '#3b82f6'};
  border: 1px solid #3b82f6;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: ${props => props.isExpanded ? '#2563eb' : 'rgba(59, 130, 246, 0.2)'};
  }
`;

const CompaniesContent = styled.div<{ isExpanded: boolean }>`
  max-width: 1200px;
  margin: 0 auto;
  padding: ${props => props.isExpanded ? '24px' : '0 24px 24px 24px'};
  animation: ${props => props.isExpanded ? slideDown : 'none'} 0.3s ease;
`;

const SearchSection = styled.div`
  margin-bottom: 24px;
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 16px;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 48px 12px 20px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
`;

const QuickActions = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const QuickButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(59, 130, 246, 0.4);
    }
  ` : `
    background: rgba(255, 255, 255, 0.8);
    color: #374151;
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const SelectionInfo = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  margin-bottom: 16px;
`;

// Horizontal company grid
const CompaniesGrid = styled.div<{ isExpanded: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.isExpanded 
    ? 'repeat(auto-fill, minmax(300px, 1fr))' 
    : 'repeat(auto-fill, minmax(250px, 1fr))'};
  gap: 16px;
  max-height: ${props => props.isExpanded ? '400px' : '200px'};
  overflow-y: auto;
  padding-right: 8px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 4px;
    
    &:hover {
      background: rgba(59, 130, 246, 0.5);
    }
  }
`;

const CompanyCard = styled.div<{ isSelected: boolean }>`
  background: ${props => props.isSelected ? 
    'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1))' : 
    'rgba(255, 255, 255, 0.8)'};
  border: 2px solid ${props => props.isSelected ? '#3b82f6' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  animation: ${fadeIn} 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
`;

const CompanyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const SectorIcon = styled.div`
  padding: 8px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 8px;
  font-size: 16px;
  box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
`;

const CompanyDetails = styled.div`
  min-width: 0;
  flex: 1;
`;

const CompanyTicker = styled.h3`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CompanySector = styled.p`
  font-size: 12px;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SelectionIndicator = styled.div<{ isSelected: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.isSelected ? '#3b82f6' : '#d1d5db'};
  border-radius: 50%;
  background: ${props => props.isSelected ? '#3b82f6' : 'transparent'};
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
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

const CompanyMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
`;

const MetricCard = styled.div<{ color: string }>`
  background: ${props => `linear-gradient(135deg, ${props.color}10, ${props.color}20)`};
  border: 1px solid ${props => `${props.color}30`};
  border-radius: 8px;
  padding: 8px;
  text-align: center;
`;

const MetricValue = styled.div<{ color: string }>`
  font-size: 12px;
  font-weight: 700;
  color: ${props => props.color};
  margin-bottom: 2px;
`;

const MetricLabel = styled.div<{ color: string }>`
  font-size: 10px;
  font-weight: 500;
  color: ${props => props.color};
`;

// Bottom section for visualization
const BottomSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

const VisualizationArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 24px;
`;

const ViewSelector = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
`;

const ViewTabs = styled.div`
  display: flex;
  gap: 12px;
`;

const ViewTab = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s ease;
  
  ${props => props.isActive ? `
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
  ` : `
    background: rgba(255, 255, 255, 0.8);
    color: #374151;
    border: 1px solid rgba(0, 0, 0, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 1);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    }
  `}
`;

const ContentArea = styled.div`
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  min-height: 500px;
  display: flex;
  flex-direction: column;
`;

const LoadingSpinner = styled.div`
  animation: ${spin} 1s linear infinite;
`;

interface HorizontalDashboardProps {}

export function HorizontalDashboard({}: HorizontalDashboardProps) {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<'network' | 'sectors' | 'performance' | 'directors' | 'shareholders' | 'insights'>('network');
  const [isExpanded, setIsExpanded] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await SecureGoogleSheetsService.fetchRealIBEXData();
      setCompanies(data);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredCompanies = useMemo(() => {
    if (!searchTerm) return companies;
    return companies.filter(company => 
      company.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      company.sector?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [companies, searchTerm]);

  const selectedCompanies = useMemo(() => {
    return companies.filter(company => selectedCompanyIds.has(company.ticker));
  }, [companies, selectedCompanyIds]);

  const toggleCompanySelection = useCallback((ticker: string) => {
    setSelectedCompanyIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ticker)) {
        newSet.delete(ticker);
      } else {
        newSet.add(ticker);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedCompanyIds(new Set(companies.map(c => c.ticker)));
  }, [companies]);

  const clearSelection = useCallback(() => {
    setSelectedCompanyIds(new Set());
  }, []);

  const getSectorIcon = (sector: string) => {
    if (sector?.toLowerCase().includes('bank') || sector?.toLowerCase().includes('financ')) return '🏦';
    if (sector?.toLowerCase().includes('energy') || sector?.toLowerCase().includes('oil')) return '⚡';
    if (sector?.toLowerCase().includes('telecom')) return '📡';
    if (sector?.toLowerCase().includes('tech')) return '💻';
    if (sector?.toLowerCase().includes('retail') || sector?.toLowerCase().includes('consumer')) return '🛍️';
    if (sector?.toLowerCase().includes('real estate') || sector?.toLowerCase().includes('property')) return '🏢';
    if (sector?.toLowerCase().includes('utilities')) return '🔧';
    if (sector?.toLowerCase().includes('transport')) return '🚚';
    return '🏭';
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `€${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `€${(value / 1e6).toFixed(1)}M`;
    return `€${value.toFixed(0)}`;
  };

  const renderContent = () => {
    if (selectedCompanyIds.size === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '16px',
          color: '#6b7280' 
        }}>
          <Building2 size={48} style={{ opacity: 0.5 }} />
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>Select Companies to Analyze</h3>
            <p style={{ margin: 0 }}>Choose one or more companies from above to visualize their network relationships</p>
          </div>
        </div>
      );
    }

    switch (activeView) {
      case 'network':
        return (
          <EChartsNetworkGraph 
            companies={selectedCompanies}
            selectedCompanyIds={selectedCompanyIds}
          />
        );
      case 'directors':
        return <DirectorsAnalysisPanel companies={selectedCompanies} selectedCompanyIds={selectedCompanyIds} />;
      case 'shareholders':
        return <ShareholdersAnalysisPanel companies={selectedCompanies} selectedCompanyIds={selectedCompanyIds} />;
      case 'insights':
        return <ComprehensiveInsights companies={selectedCompanies} selectedCompanyIds={selectedCompanyIds} />;
      default:
        return <div>View not implemented yet</div>;
    }
  };

  return (
    <>
      <GlobalStyle />
      <Container>
        <TopSection isExpanded={isExpanded}>
          <Header>
            <HeaderContent>
              <HeaderLeft>
                <IconWrapper>
                  <Building2 size={24} color="white" />
                </IconWrapper>
                <TitleSection>
                  <Title>IBEX 35 Network Dashboard</Title>
                  <Subtitle>Corporate Governance & Relationship Analysis</Subtitle>
                </TitleSection>
              </HeaderLeft>
              <HeaderControls>
                <QuickButton onClick={loadData} disabled={loading}>
                  <LoadingSpinner>
                    <RefreshCw size={16} />
                  </LoadingSpinner>
                  Refresh Data
                </QuickButton>
                <ToggleButton 
                  isExpanded={isExpanded}
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  {isExpanded ? 'Collapse' : 'Expand'} Companies
                </ToggleButton>
              </HeaderControls>
            </HeaderContent>
          </Header>

          <CompaniesContent isExpanded={isExpanded}>
            <SearchSection>
              <SearchContainer>
                <SearchInput
                  type="text"
                  placeholder="Search companies by name, ticker, or sector..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <SearchIcon>
                  <Search size={20} />
                </SearchIcon>
              </SearchContainer>

              <QuickActions>
                <QuickButton variant="primary" onClick={selectAll}>
                  <Building2 size={16} />
                  Select All ({companies.length})
                </QuickButton>
                <QuickButton onClick={clearSelection}>
                  Clear Selection
                </QuickButton>
              </QuickActions>

              {selectedCompanyIds.size > 0 && (
                <SelectionInfo>
                  <span>
                    <strong>{selectedCompanyIds.size}</strong> companies selected
                  </span>
                  <span style={{ fontSize: '12px', color: '#6b7280' }}>
                    {selectedCompanies.reduce((sum, c) => sum + (c.marketCapEur || 0), 0) > 0 && 
                      `Total Market Cap: ${formatCurrency(selectedCompanies.reduce((sum, c) => sum + (c.marketCapEur || 0), 0))}`
                    }
                  </span>
                </SelectionInfo>
              )}
            </SearchSection>

            <CompaniesGrid isExpanded={isExpanded}>
              {filteredCompanies.map((company) => (
                <CompanyCard
                  key={company.ticker}
                  isSelected={selectedCompanyIds.has(company.ticker)}
                  onClick={() => toggleCompanySelection(company.ticker)}
                >
                  <CompanyHeader>
                    <CompanyInfo>
                      <SectorIcon>
                        {getSectorIcon(company.sector)}
                      </SectorIcon>
                      <CompanyDetails>
                        <CompanyTicker>{company.formattedTicker || company.ticker}</CompanyTicker>
                        <CompanySector>{company.sector}</CompanySector>
                      </CompanyDetails>
                    </CompanyInfo>
                    <SelectionIndicator isSelected={selectedCompanyIds.has(company.ticker)} />
                  </CompanyHeader>

                  <CompanyMetrics>
                    <MetricCard color="#3b82f6">
                      <MetricValue color="#3b82f6">
                        {formatCurrency(company.marketCapEur || 0)}
                      </MetricValue>
                      <MetricLabel color="#3b82f6">Market Cap</MetricLabel>
                    </MetricCard>
                    <MetricCard color="#10b981">
                      <MetricValue color="#10b981">
                        €{company.currentPriceEur?.toFixed(2) || '0.00'}
                      </MetricValue>
                      <MetricLabel color="#10b981">Current Price</MetricLabel>
                    </MetricCard>
                  </CompanyMetrics>
                </CompanyCard>
              ))}
            </CompaniesGrid>
          </CompaniesContent>
        </TopSection>

        <BottomSection>
          <VisualizationArea>
            <ViewSelector>
              <ViewTabs>
                <ViewTab
                  isActive={activeView === 'network'}
                  onClick={() => setActiveView('network')}
                >
                  <Network size={16} />
                  Network Graph
                </ViewTab>
                <ViewTab
                  isActive={activeView === 'directors'}
                  onClick={() => setActiveView('directors')}
                >
                  <Users size={16} />
                  Directors Analysis
                </ViewTab>
                <ViewTab
                  isActive={activeView === 'shareholders'}
                  onClick={() => setActiveView('shareholders')}
                >
                  <PieChart size={16} />
                  Shareholders
                </ViewTab>
                <ViewTab
                  isActive={activeView === 'insights'}
                  onClick={() => setActiveView('insights')}
                >
                  <Sparkles size={16} />
                  Insights
                </ViewTab>
              </ViewTabs>
            </ViewSelector>

            <ContentArea>
              {renderContent()}
            </ContentArea>
          </VisualizationArea>
        </BottomSection>
      </Container>
    </>
  );
}