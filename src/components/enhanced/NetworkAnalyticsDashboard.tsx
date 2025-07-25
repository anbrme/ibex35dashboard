import styled from 'styled-components';
import { TrendingUp, Users, Building, Target, Award, BarChart3, Network, Zap } from 'lucide-react';
import type { NetworkAnalysis } from '../../services/networkAnalytics';

interface Props {
  analysis: NetworkAnalysis | null;
  isVisible: boolean;
}

const Dashboard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible'
})<{ isVisible: boolean }>`
  position: absolute;
  top: 80px;
  right: 16px;
  width: 300px;
  max-height: 70vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 12;
  transform: ${props => props.isVisible ? 'translateX(0)' : 'translateX(100%)'};
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: all 0.3s ease;
  overflow-y: auto;
`;

const DashboardTitle = styled.h3`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Section = styled.div`
  margin-bottom: 20px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
`;

const MetricCard = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  border: 1px solid #e5e7eb;
`;

const MetricValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
`;

const MetricLabel = styled.div`
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
  line-height: 1.2;
`;

const LargeMetricCard = styled.div`
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  margin-bottom: 16px;
`;

const LargeMetricValue = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
`;

const LargeMetricLabel = styled.div`
  font-size: 12px;
  opacity: 0.9;
  font-weight: 500;
`;

const EntityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EntityItem = styled.div`
  background: #f3f4f6;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  justify-content: between;
  align-items: center;
  font-size: 12px;
`;

const EntityName = styled.div`
  font-weight: 500;
  color: #1f2937;
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const EntityValue = styled.div`
  font-weight: 600;
  color: #3b82f6;
  font-size: 11px;
`;

const PowerMatrix = styled.div`
  background: linear-gradient(135deg, #10b981 0%, #047857 100%);
  color: white;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const PowerMatrixTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PowerItem = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 12px;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const PowerName = styled.div`
  flex: 1;
  margin-right: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const PowerScore = styled.div`
  font-weight: 600;
  font-size: 11px;
`;

const NoDataMessage = styled.div`
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 20px;
`;

export function NetworkAnalyticsDashboard({ analysis, isVisible }: Props) {
  if (!analysis) {
    return (
      <Dashboard isVisible={isVisible}>
        <DashboardTitle>
          <BarChart3 size={18} />
          Network Analytics
        </DashboardTitle>
        <NoDataMessage>
          Select companies to view network analytics
        </NoDataMessage>
      </Dashboard>
    );
  }

  const formatMetric = (value: number, decimals: number = 2): string => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
    return value.toFixed(decimals);
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const topInfluencers = analysis.keyInfluencers.slice(0, 5);
  const topCrossBoardDirectors = analysis.crossBoardDirectors.slice(0, 3);
  const topShareholders = analysis.majorShareholders.slice(0, 3);
  const topPowerMatrix = analysis.powerInfluenceMatrix.slice(0, 4);

  return (
    <Dashboard isVisible={isVisible}>
      <DashboardTitle>
        <BarChart3 size={18} />
        Network Analytics
      </DashboardTitle>

      {/* Network Overview */}
      <Section>
        <LargeMetricCard>
          <LargeMetricValue>{formatPercentage(analysis.networkDensity)}</LargeMetricValue>
          <LargeMetricLabel>Network Density</LargeMetricLabel>
        </LargeMetricCard>

        <MetricsGrid>
          <MetricCard>
            <MetricValue>{analysis.totalNodes}</MetricValue>
            <MetricLabel>Total Nodes</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{analysis.totalEdges}</MetricValue>
            <MetricLabel>Connections</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{analysis.averageDegree.toFixed(1)}</MetricValue>
            <MetricLabel>Avg Degree</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{analysis.boardInterlocks.interlockIndex}</MetricValue>
            <MetricLabel>Board Interlocks</MetricLabel>
          </MetricCard>
        </MetricsGrid>
      </Section>

      {/* Board Interlock Analysis */}
      <Section>
        <SectionTitle>
          <Users size={14} />
          Board Interlock Metrics
        </SectionTitle>
        <MetricsGrid>
          <MetricCard>
            <MetricValue>{formatMetric(analysis.boardInterlocks.structuralPower, 0)}</MetricValue>
            <MetricLabel>Structural Power</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{analysis.boardInterlocks.crossBoardConnections}</MetricValue>
            <MetricLabel>Cross-Board Links</MetricLabel>
          </MetricCard>
        </MetricsGrid>
      </Section>

      {/* Ownership Analysis */}
      <Section>
        <SectionTitle>
          <Building size={14} />
          Ownership Analysis
        </SectionTitle>
        <MetricsGrid>
          <MetricCard>
            <MetricValue>{analysis.ownershipAnalysis.concentrationScore.toFixed(1)}%</MetricValue>
            <MetricLabel>Concentration Score</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{analysis.ownershipAnalysis.votingPower.toFixed(2)}</MetricValue>
            <MetricLabel>Voting Power</MetricLabel>
          </MetricCard>
        </MetricsGrid>
      </Section>

      {/* Market Analysis */}
      <Section>
        <SectionTitle>
          <TrendingUp size={14} />
          Market Analysis
        </SectionTitle>
        <MetricsGrid>
          <MetricCard>
            <MetricValue>{formatPercentage(analysis.marketAnalysis.liquidityScore)}</MetricValue>
            <MetricLabel>Liquidity Score</MetricLabel>
          </MetricCard>
          <MetricCard>
            <MetricValue>{formatPercentage(analysis.marketAnalysis.volatilityFootprint)}</MetricValue>
            <MetricLabel>Volatility Footprint</MetricLabel>
          </MetricCard>
        </MetricsGrid>
      </Section>

      {/* Power-Influence Matrix */}
      {topPowerMatrix.length > 0 && (
        <Section>
          <PowerMatrix>
            <PowerMatrixTitle>
              <Target size={14} />
              Power-Influence Matrix
            </PowerMatrixTitle>
            {topPowerMatrix.map((entity, idx) => (
              <PowerItem key={entity.id}>
                <PowerName>
                  {idx + 1}. {entity.name.split(' ').slice(0, 2).join(' ')}
                </PowerName>
                <PowerScore>{formatMetric(entity.structuralPower, 1)}</PowerScore>
              </PowerItem>
            ))}
          </PowerMatrix>
        </Section>
      )}

      {/* Key Influencers */}
      {topInfluencers.length > 0 && (
        <Section>
          <SectionTitle>
            <Award size={14} />
            Key Influencers
          </SectionTitle>
          <EntityList>
            {topInfluencers.map((node) => (
              <EntityItem key={node.id}>
                <EntityName>{node.name}</EntityName>
                <EntityValue>{node.metrics.influence.toFixed(2)}</EntityValue>
              </EntityItem>
            ))}
          </EntityList>
        </Section>
      )}

      {/* Cross-Board Directors */}
      {topCrossBoardDirectors.length > 0 && (
        <Section>
          <SectionTitle>
            <Network size={14} />
            Cross-Board Directors
          </SectionTitle>
          <EntityList>
            {topCrossBoardDirectors.map((node) => (
              <EntityItem key={node.id}>
                <EntityName>{node.name}</EntityName>
                <EntityValue>{node.metrics.connections} boards</EntityValue>
              </EntityItem>
            ))}
          </EntityList>
        </Section>
      )}

      {/* Major Shareholders */}
      {topShareholders.length > 0 && (
        <Section>
          <SectionTitle>
            <Zap size={14} />
            Major Shareholders
          </SectionTitle>
          <EntityList>
            {topShareholders.map((node) => (
              <EntityItem key={node.id}>
                <EntityName>{node.name}</EntityName>
                <EntityValue>{node.metrics.influence.toFixed(1)}% power</EntityValue>
              </EntityItem>
            ))}
          </EntityList>
        </Section>
      )}
    </Dashboard>
  );
}