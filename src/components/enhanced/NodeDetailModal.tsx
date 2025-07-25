import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { X, ExternalLink, Users, Building, TrendingUp, Globe, Award } from 'lucide-react';
import { wikipediaService, type WikipediaData } from '../../services/wikipediaService';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface NodeData {
  id: string;
  type: 'company' | 'director' | 'shareholder';
  label: string;
  company?: SecureIBEXCompanyData;
  director?: {
    name: string;
    position?: string;
    allPositions?: string[];
    companyCount?: number;
    appointmentDate?: string;
  };
  shareholder?: {
    name: string;
    type?: string;
    percentage?: number;
    totalPercentage?: number;
    companyCount?: number;
    reportDate?: string;
  };
  companies?: string[];
  networkMetrics?: {
    centrality: number;
    betweennessCentrality: number;
    closeness: number;
    degree: number;
    influence: number;
    connections: number;
  };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  nodeData: NodeData | null;
}

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  opacity: ${props => props.isOpen ? 1 : 0};
  visibility: ${props => props.isOpen ? 'visible' : 'hidden'};
  transition: all 0.3s ease;
`;

const Modal = styled.div<{ isOpen: boolean }>`
  background: white;
  border-radius: 20px;
  width: 90vw;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
  transform: ${props => props.isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(20px)'};
  transition: transform 0.3s ease;
  position: relative;
`;

const Header = styled.div`
  padding: 32px;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 24px;
  right: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #f3f4f6;
  }
`;

const Title = styled.h2`
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  margin: 0;
  color: #6b7280;
  font-size: 16px;
  font-weight: 500;
`;

const Content = styled.div`
  padding: 32px;
`;

const Section = styled.div`
  margin-bottom: 32px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WikipediaCard = styled.div`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

const WikipediaImage = styled.img`
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`;

const WikipediaContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const WikipediaTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
`;

const WikipediaText = styled.p`
  margin: 0 0 16px 0;
  color: #4b5563;
  line-height: 1.6;
  font-size: 14px;
`;

const WikipediaLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  
  &:hover {
    text-decoration: underline;
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
`;

const MetricCard = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const CompanyList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const CompanyTag = styled.span`
  background: #dbeafe;
  color: #1e40af;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 16px;
  border-radius: 12px;
  text-align: center;
`;

function getTypeIcon(type: string) {
  switch (type) {
    case 'company': return <Building size={24} />;
    case 'director': return <Users size={24} />;
    case 'shareholder': return <TrendingUp size={24} />;
    default: return <Globe size={24} />;
  }
}

function formatCurrency(value: number): string {
  if (value >= 1e9) return `€${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `€${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `€${(value / 1e3).toFixed(1)}K`;
  return `€${value.toFixed(0)}`;
}

export function NodeDetailModal({ isOpen, onClose, nodeData }: Props) {
  const [wikipediaData, setWikipediaData] = useState<WikipediaData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !nodeData) {
      setWikipediaData(null);
      setError(null);
      return;
    }

    const fetchWikipediaData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        let searchTerm = '';
        
        if (nodeData.type === 'company' && nodeData.company) {
          searchTerm = nodeData.company.company;
        } else if (nodeData.type === 'director' && nodeData.director) {
          searchTerm = nodeData.director.name;
        } else if (nodeData.type === 'shareholder' && nodeData.shareholder) {
          searchTerm = nodeData.shareholder.name;
        }

        if (searchTerm) {
          const data = nodeData.type === 'company' 
            ? await wikipediaService.searchCompany(searchTerm)
            : await wikipediaService.searchPerson(searchTerm);
          setWikipediaData(data);
        }
      } catch (err) {
        setError('Failed to fetch Wikipedia data');
        console.error('Wikipedia fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWikipediaData();
  }, [isOpen, nodeData]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Safety checks - don't render modal if critical data is missing (after all hooks)
  if (!isOpen || !nodeData || !nodeData.id || !nodeData.label) {
    return null;
  }
  
  // Additional safety check - don't render if the required data is missing
  if (nodeData.type === 'company' && !nodeData.company) {
    console.error('Modal opened for company but company data is missing:', {
      nodeData,
      hasId: !!nodeData.id,
      hasLabel: !!nodeData.label,
      hasCompany: !!nodeData.company,
      nodeDataKeys: Object.keys(nodeData)
    });
    return null;
  }
  if (nodeData.type === 'director' && !nodeData.director) {
    console.error('Modal opened for director but director data is missing:', nodeData);
    return null;
  }
  if (nodeData.type === 'shareholder' && !nodeData.shareholder) {
    console.error('Modal opened for shareholder but shareholder data is missing:', nodeData);
    return null;
  }

  const renderCompanyDetails = () => {
    const company = nodeData.company;
    if (!company) {
      console.error('Company data is missing from nodeData:', nodeData);
      return <div>Company data not available</div>;
    }
    return (
      <>
        <Section>
          <SectionTitle>
            <Building size={18} />
            Company Metrics
          </SectionTitle>
          <MetricsGrid>
            <MetricCard>
              <MetricValue>{formatCurrency(company.marketCapEur)}</MetricValue>
              <MetricLabel>Market Cap</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>€{company.currentPriceEur.toFixed(2)}</MetricValue>
              <MetricLabel>Current Price</MetricLabel>
            </MetricCard>
            {company.peRatio && (
              <MetricCard>
                <MetricValue>{company.peRatio.toFixed(1)}</MetricValue>
                <MetricLabel>P/E Ratio</MetricLabel>
              </MetricCard>
            )}
            {company.changePercent !== undefined && (
              <MetricCard>
                <MetricValue style={{ color: company.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
                  {company.changePercent > 0 ? '+' : ''}{company.changePercent.toFixed(2)}%
                </MetricValue>
                <MetricLabel>Change</MetricLabel>
              </MetricCard>
            )}
          </MetricsGrid>
        </Section>

        {company.directors && company.directors.length > 0 && (
          <Section>
            <SectionTitle>
              <Users size={18} />
              Board of Directors ({company.directors.length})
            </SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {company.directors.slice(0, 5).map((director, idx) => (
                <div key={idx} style={{ 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: '500' }}>{director.name}</span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>{director.position || 'Director'}</span>
                </div>
              ))}
              {company.directors.length > 5 && (
                <div style={{ color: '#6b7280', fontSize: '14px', textAlign: 'center', padding: '8px' }}>
                  +{company.directors.length - 5} more directors
                </div>
              )}
            </div>
          </Section>
        )}

        {nodeData.networkMetrics && (
          <Section>
            <SectionTitle>
              <TrendingUp size={18} />
              Network Analytics
            </SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.influence.toFixed(2)}</MetricValue>
                <MetricLabel>Influence Score</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.centrality.toFixed(2)}</MetricValue>
                <MetricLabel>Centrality</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.connections}</MetricValue>
                <MetricLabel>Network Connections</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.betweennessCentrality.toFixed(2)}</MetricValue>
                <MetricLabel>Betweenness</MetricLabel>
              </MetricCard>
            </MetricsGrid>
          </Section>
        )}
      </>
    );
  };

  const renderDirectorDetails = () => {
    const director = nodeData.director;
    if (!director) {
      console.error('Director data is missing from nodeData:', nodeData);
      return <div>Director data not available</div>;
    }
    return (
      <>
        <Section>
          <SectionTitle>
            <Award size={18} />
            Board Positions
          </SectionTitle>
          <MetricsGrid>
            <MetricCard>
              <MetricValue>{director.companyCount || 1}</MetricValue>
              <MetricLabel>Companies</MetricLabel>
            </MetricCard>
            {director.appointmentDate && (
              <MetricCard>
                <MetricValue>{director.appointmentDate}</MetricValue>
                <MetricLabel>Since</MetricLabel>
              </MetricCard>
            )}
          </MetricsGrid>
        </Section>

        {director.allPositions && director.allPositions.length > 0 && (
          <Section>
            <SectionTitle>
              <Users size={18} />
              Positions
            </SectionTitle>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {director.allPositions.map((position, idx) => (
                <CompanyTag key={idx}>{position}</CompanyTag>
              ))}
            </div>
          </Section>
        )}

        {nodeData.companies && nodeData.companies.length > 0 && (
          <Section>
            <SectionTitle>
              <Building size={18} />
              Companies
            </SectionTitle>
            <CompanyList>
              {nodeData.companies.map((company, idx) => (
                <CompanyTag key={idx}>{company}</CompanyTag>
              ))}
            </CompanyList>
          </Section>
        )}

        {nodeData.networkMetrics && (
          <Section>
            <SectionTitle>
              <TrendingUp size={18} />
              Network Analytics
            </SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.influence.toFixed(2)}</MetricValue>
                <MetricLabel>Influence Score</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.centrality.toFixed(2)}</MetricValue>
                <MetricLabel>Centrality</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.connections}</MetricValue>
                <MetricLabel>Network Connections</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.betweennessCentrality.toFixed(2)}</MetricValue>
                <MetricLabel>Betweenness</MetricLabel>
              </MetricCard>
            </MetricsGrid>
          </Section>
        )}

        {nodeData.networkMetrics && (
          <Section>
            <SectionTitle>
              <TrendingUp size={18} />
              Network Analytics
            </SectionTitle>
            <MetricsGrid>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.influence.toFixed(2)}</MetricValue>
                <MetricLabel>Influence Score</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.centrality.toFixed(2)}</MetricValue>
                <MetricLabel>Centrality</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.connections}</MetricValue>
                <MetricLabel>Network Connections</MetricLabel>
              </MetricCard>
              <MetricCard>
                <MetricValue>{nodeData.networkMetrics.betweennessCentrality.toFixed(2)}</MetricValue>
                <MetricLabel>Betweenness</MetricLabel>
              </MetricCard>
            </MetricsGrid>
          </Section>
        )}
      </>
    );
  };

  const renderShareholderDetails = () => {
    const shareholder = nodeData.shareholder;
    if (!shareholder) {
      console.error('Shareholder data is missing from nodeData:', nodeData);
      return <div>Shareholder data not available</div>;
    }
    return (
      <>
        <Section>
          <SectionTitle>
            <TrendingUp size={18} />
            Ownership Details
          </SectionTitle>
          <MetricsGrid>
            <MetricCard>
              <MetricValue>{shareholder.companyCount || 1}</MetricValue>
              <MetricLabel>Companies</MetricLabel>
            </MetricCard>
            <MetricCard>
              <MetricValue>{(shareholder.totalPercentage || shareholder.percentage || 0).toFixed(2)}%</MetricValue>
              <MetricLabel>Total Ownership</MetricLabel>
            </MetricCard>
            {shareholder.type && (
              <MetricCard>
                <MetricValue>{shareholder.type}</MetricValue>
                <MetricLabel>Shareholder Type</MetricLabel>
              </MetricCard>
            )}
            {shareholder.reportDate && (
              <MetricCard>
                <MetricValue>{shareholder.reportDate}</MetricValue>
                <MetricLabel>Report Date</MetricLabel>
              </MetricCard>
            )}
          </MetricsGrid>
        </Section>

        {nodeData.companies && nodeData.companies.length > 0 && (
          <Section>
            <SectionTitle>
              <Building size={18} />
              Portfolio Companies
            </SectionTitle>
            <CompanyList>
              {nodeData.companies.map((company, idx) => (
                <CompanyTag key={idx}>{company}</CompanyTag>
              ))}
            </CompanyList>
          </Section>
        )}
      </>
    );
  };

  const renderModalContent = () => {
    try {
      return (
        <>
          <Header>
            <Title>
              {getTypeIcon(nodeData.type)}
              {nodeData.label}
            </Title>
            <Subtitle>
              {nodeData.type === 'company' && nodeData.company?.sector}
              {nodeData.type === 'director' && 'Board Director'}
              {nodeData.type === 'shareholder' && 'Shareholder'}
            </Subtitle>
            <CloseButton onClick={onClose}>
              <X size={20} />
            </CloseButton>
          </Header>

        <Content>
          {isLoading && (
            <Section>
              <LoadingSpinner>Loading additional information...</LoadingSpinner>
            </Section>
          )}

          {error && (
            <Section>
              <ErrorMessage>{error}</ErrorMessage>
            </Section>
          )}

          {wikipediaData && (
            <Section>
              <SectionTitle>
                <Globe size={18} />
                Wikipedia Information
              </SectionTitle>
              <WikipediaCard>
                {wikipediaData.image && (
                  <WikipediaImage src={wikipediaData.image} alt={wikipediaData.title} />
                )}
                <WikipediaContent>
                  <WikipediaTitle>{wikipediaData.title}</WikipediaTitle>
                  <WikipediaText>
                    {wikipediaData.summary.length > 300 
                      ? `${wikipediaData.summary.substring(0, 300)}...`
                      : wikipediaData.summary
                    }
                  </WikipediaText>
                  <WikipediaLink href={wikipediaData.url} target="_blank" rel="noopener noreferrer">
                    Read more on Wikipedia
                    <ExternalLink size={14} />
                  </WikipediaLink>
                </WikipediaContent>
              </WikipediaCard>
            </Section>
          )}

          {!isLoading && !error && !wikipediaData && (
            <Section>
              <SectionTitle>
                <Globe size={18} />
                External Information
              </SectionTitle>
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#6b7280', 
                background: '#f9fafb', 
                borderRadius: '12px' 
              }}>
                No relevant Wikipedia information found for this entity.
              </div>
            </Section>
          )}

          {nodeData.type === 'company' && renderCompanyDetails()}
          {nodeData.type === 'director' && renderDirectorDetails()}
          {nodeData.type === 'shareholder' && renderShareholderDetails()}
        </Content>
        </>
      );
    } catch (error) {
      console.error('Error rendering modal content:', error);
      return (
        <Header>
          <Title>Error</Title>
          <CloseButton onClick={onClose}>
            <X size={20} />
          </CloseButton>
        </Header>
      );
    }
  };

  return (
    <Overlay isOpen={isOpen} onClick={handleOverlayClick}>
      <Modal isOpen={isOpen}>
        {renderModalContent()}
      </Modal>
    </Overlay>
  );
}