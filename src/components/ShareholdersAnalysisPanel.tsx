import { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, TrendingUp, Building2, User, Landmark, Shield, HelpCircle } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';

interface Props {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding-right: 8px;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.3);
    }
  }
`;

const CompanyCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'expanded'
})<{ expanded: boolean }>`
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.05), rgba(5, 150, 105, 0.05));
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  position: relative;
  z-index: ${props => props.expanded ? 10 : 1};
  margin-bottom: ${props => props.expanded ? '24px' : '0px'};
  
  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    z-index: ${props => props.expanded ? 10 : 5};
  }
`;

const CompanyHeader = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'expanded'
})<{ expanded: boolean }>`
  padding: 20px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.15));
  }
`;

const CompanyHeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const CompanyInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CompanyIcon = styled.div`
  padding: 12px;
  background: linear-gradient(135deg, #10b981, #059669);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
`;

const CompanyDetails = styled.div``;

const CompanyName = styled.h3`
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
`;

const CompanyTicker = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ShareholdersBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
`;

const ExpandIcon = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'expanded'
})<{ expanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
  transition: all 0.2s ease;
  transform: ${props => props.expanded ? 'rotate(180deg)' : 'rotate(0deg)'};
  
  &:hover {
    background: white;
  }
`;

const ShareholdersList = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'expanded'
})<{ expanded: boolean }>`
  max-height: ${props => props.expanded ? '800px' : '0px'};
  overflow-y: ${props => props.expanded ? 'auto' : 'hidden'};
  transition: max-height 0.3s ease;
  
  /* Custom scrollbar for shareholders list */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(16, 185, 129, 0.3);
    border-radius: 2px;
    
    &:hover {
      background: rgba(16, 185, 129, 0.5);
    }
  }
`;

const ShareholdersGrid = styled.div`
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const ShareholderCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 16px;
  transition: all 0.2s ease;
  
  &:hover {
    background: white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

const ShareholderHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const ShareholderAvatar = styled.div<{ type: string }>`
  width: 40px;
  height: 40px;
  background: ${props => getTypeColor(props.type)};
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
`;

const ShareholderInfo = styled.div`
  flex: 1;
`;

const ShareholderName = styled.h4`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
`;

const ShareholderType = styled.p<{ type: string }>`
  margin: 0;
  font-size: 14px;
  color: ${props => getTypeTextColor(props.type)};
  line-height: 1.3;
  font-weight: 600;
`;

const ShareholderMeta = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
`;

const MetaIcon = styled.div`
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const PercentageBadge = styled.div<{ percentage: number }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: ${props => 
    props.percentage >= 10 
      ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1))' 
      : props.percentage >= 5
      ? 'linear-gradient(135deg, rgba(251, 146, 60, 0.1), rgba(249, 115, 22, 0.1))'
      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))'};
  border: 1px solid ${props => 
    props.percentage >= 10 
      ? 'rgba(239, 68, 68, 0.2)' 
      : props.percentage >= 5
      ? 'rgba(251, 146, 60, 0.2)'
      : 'rgba(16, 185, 129, 0.2)'};
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: ${props => 
    props.percentage >= 10 
      ? '#dc2626' 
      : props.percentage >= 5
      ? '#ea580c'
      : '#059669'};
`;

const CompanyTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1));
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #065f46;
`;

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'institutional': return <Landmark size={20} color="white" />;
    case 'individual': return <User size={20} color="white" />;
    case 'government': return <Shield size={20} color="white" />;
    case 'insider': return <Building2 size={20} color="white" />;
    default: return <HelpCircle size={20} color="white" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'institutional': return 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    case 'individual': return 'linear-gradient(135deg, #10b981, #059669)';
    case 'government': return 'linear-gradient(135deg, #7c3aed, #5b21b6)';
    case 'insider': return 'linear-gradient(135deg, #f59e0b, #d97706)';
    default: return 'linear-gradient(135deg, #6b7280, #4b5563)';
  }
};

const getTypeTextColor = (type: string) => {
  switch (type) {
    case 'institutional': return '#1d4ed8';
    case 'individual': return '#059669';
    case 'government': return '#5b21b6';
    case 'insider': return '#d97706';
    default: return '#4b5563';
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'institutional': return 'Institutional';
    case 'individual': return 'Individual';
    case 'government': return 'Government';
    case 'insider': return 'Insider';
    default: return 'Other';
  }
};


export function ShareholdersAnalysisPanel({ companies, selectedCompanyIds }: Props) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const relevantCompanies = companies
    .filter(c => (selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker)) && c.shareholders && c.shareholders.length > 0)
    .sort((a, b) => (b.shareholders?.length || 0) - (a.shareholders?.length || 0));

  const toggleCompany = (ticker: string) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
      } else {
        next.add(ticker);
      }
      return next;
    });
  };

  if (relevantCompanies.length === 0) {
    return (
      <Container>
        <div style={{ 
          textAlign: 'center', 
          padding: '64px 0', 
          color: '#6b7280' 
        }}>
          <TrendingUp size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>No Shareholders Found</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Select companies to view their ownership structure</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {relevantCompanies.map(company => {
        const isExpanded = expandedCompanies.has(company.ticker);
        const shareholdersCount = company.shareholders?.length || 0;
        
        return (
          <CompanyCard key={company.ticker} expanded={isExpanded}>
            <CompanyHeader 
              expanded={isExpanded}
              onClick={() => toggleCompany(company.ticker)}
            >
              <CompanyHeaderContent>
                <CompanyInfo>
                  <CompanyIcon>
                    <Building2 size={20} color="white" />
                  </CompanyIcon>
                  <CompanyDetails>
                    <CompanyName>{company.company}</CompanyName>
                    <CompanyTicker>{company.formattedTicker || company.ticker} • {company.sector}</CompanyTicker>
                  </CompanyDetails>
                </CompanyInfo>
                
                <HeaderControls>
                  <ShareholdersBadge>
                    <TrendingUp size={16} />
                    {shareholdersCount} shareholders
                  </ShareholdersBadge>
                  <ExpandIcon expanded={isExpanded}>
                    <ChevronDown size={16} color="#6b7280" />
                  </ExpandIcon>
                </HeaderControls>
              </CompanyHeaderContent>
            </CompanyHeader>

            <ShareholdersList expanded={isExpanded}>
              <ShareholdersGrid>
                {company.shareholders?.map((shareholder, idx) => (
                  <ShareholderCard key={idx}>
                    <ShareholderHeader>
                      <ShareholderAvatar type={shareholder.type || 'other'}>
                        {getTypeIcon(shareholder.type || 'other')}
                      </ShareholderAvatar>
                      <ShareholderInfo>
                        <ShareholderName>{shareholder.name}</ShareholderName>
                        <ShareholderType type={shareholder.type || 'other'}>
                          {getTypeLabel(shareholder.type || 'other')}
                        </ShareholderType>
                      </ShareholderInfo>
                    </ShareholderHeader>
                    
                    <ShareholderMeta>
                      <MetaItem>
                        <MetaIcon>
                          <Building2 size={14} />
                        </MetaIcon>
                        <CompanyTag>
                          <span>{company.formattedTicker || company.ticker}</span>
                        </CompanyTag>
                      </MetaItem>
                      
                      <MetaItem>
                        <MetaIcon>📊</MetaIcon>
                        <PercentageBadge percentage={shareholder.percentage}>
                          {shareholder.percentage.toFixed(1)}% ownership
                        </PercentageBadge>
                      </MetaItem>
                      
                      {shareholder.reportDate && (
                        <MetaItem>
                          <MetaIcon>📅</MetaIcon>
                          <span>As of {shareholder.reportDate}</span>
                        </MetaItem>
                      )}
                    </ShareholderMeta>
                  </ShareholderCard>
                ))}
              </ShareholdersGrid>
            </ShareholdersList>
          </CompanyCard>
        );
      })}
    </Container>
  );
}