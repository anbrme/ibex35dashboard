import { useState } from 'react';
import styled from 'styled-components';
import { ChevronDown, Users, Building2 } from 'lucide-react';
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
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(29, 78, 216, 0.05));
  border: 1px solid rgba(59, 130, 246, 0.2);
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
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1));
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(29, 78, 216, 0.15));
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
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
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

const DirectorsBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  color: white;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.3);
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

const DirectorsList = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'expanded'
})<{ expanded: boolean }>`
  max-height: ${props => props.expanded ? '800px' : '0px'};
  overflow-y: ${props => props.expanded ? 'auto' : 'hidden'};
  transition: max-height 0.3s ease;
  
  /* Custom scrollbar for directors list */
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.05);
    border-radius: 2px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.3);
    border-radius: 2px;
    
    &:hover {
      background: rgba(59, 130, 246, 0.5);
    }
  }
`;

const DirectorsGrid = styled.div`
  padding: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
`;

const DirectorCard = styled.div`
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

const DirectorHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
`;

const DirectorAvatar = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  flex-shrink: 0;
`;

const DirectorInfo = styled.div`
  flex: 1;
`;

const DirectorName = styled.h4`
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.3;
`;

const DirectorPosition = styled.p`
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.3;
`;

const DirectorMeta = styled.div`
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

const CompanyTag = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #1e40af;
`;

const getDirectorInitials = (name: string): string => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

export function DirectorsAnalysisPanel({ companies, selectedCompanyIds }: Props) {
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  const relevantCompanies = companies
    .filter(c => (selectedCompanyIds.size === 0 || selectedCompanyIds.has(c.ticker)) && c.directors.length > 0)
    .sort((a, b) => b.directors.length - a.directors.length);

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
          <Users size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: 18, fontWeight: 600 }}>No Directors Found</h3>
          <p style={{ margin: 0, fontSize: 14 }}>Select companies to view their board members</p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {relevantCompanies.map(company => {
        const isExpanded = expandedCompanies.has(company.ticker);
        
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
                  <DirectorsBadge>
                    <Users size={16} />
                    {company.directors.length} directors
                  </DirectorsBadge>
                  <ExpandIcon expanded={isExpanded}>
                    <ChevronDown size={16} color="#6b7280" />
                  </ExpandIcon>
                </HeaderControls>
              </CompanyHeaderContent>
            </CompanyHeader>

            <DirectorsList expanded={isExpanded}>
              <DirectorsGrid>
                {company.directors.map((director, idx) => (
                  <DirectorCard key={idx}>
                    <DirectorHeader>
                      <DirectorAvatar>
                        {getDirectorInitials(director.name)}
                      </DirectorAvatar>
                      <DirectorInfo>
                        <DirectorName>{director.name}</DirectorName>
                        <DirectorPosition>{director.position}</DirectorPosition>
                      </DirectorInfo>
                    </DirectorHeader>
                    
                    <DirectorMeta>
                      <MetaItem>
                        <MetaIcon>
                          <Building2 size={14} />
                        </MetaIcon>
                        <CompanyTag>
                          <span>{company.formattedTicker || company.ticker}</span>
                        </CompanyTag>
                      </MetaItem>
                      
                      {director.appointmentDate && (
                        <MetaItem>
                          <MetaIcon>📅</MetaIcon>
                          <span>Since {director.appointmentDate}</span>
                        </MetaItem>
                      )}
                      
                      {director.bioUrl && (
                        <MetaItem>
                          <MetaIcon>🔗</MetaIcon>
                          <a 
                            href={director.bioUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: '#3b82f6', textDecoration: 'none' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            View Biography
                          </a>
                        </MetaItem>
                      )}
                    </DirectorMeta>
                  </DirectorCard>
                ))}
              </DirectorsGrid>
            </DirectorsList>
          </CompanyCard>
        );
      })}
    </Container>
  );
}