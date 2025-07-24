import React, { useState, useMemo } from 'react';
import styled from 'styled-components';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ComposedChart } from 'recharts';
import { TrendingUp, DollarSign, BarChart3, Users, Briefcase, MessageSquare, Target, Activity, ArrowUp } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface ComprehensiveInsightsProps {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}

const InsightsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);
`;

const Tab = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 12px 12px 0 0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${props => props.isActive 
    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
    : 'rgba(255, 255, 255, 0.8)'};
  color: ${props => props.isActive ? 'white' : '#6b7280'};
  border-bottom: 2px solid ${props => props.isActive ? 'transparent' : 'rgba(0, 0, 0, 0.05)'};

  &:hover {
    background: ${props => props.isActive 
      ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' 
      : 'rgba(59, 130, 246, 0.1)'};
    color: ${props => props.isActive ? 'white' : '#3b82f6'};
  }
`;

const InsightsHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const HeaderIcon = styled.div`
  padding: 12px;
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(59, 130, 246, 0.3);
`;

const HeaderTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
`;

const HeaderSubtitle = styled.p`
  font-size: 14px;
  color: #6b7280;
  margin: 0;
`;

const KPIGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;
`;

const KPICard = styled.div<{ color: string }>`
  background: ${props => `linear-gradient(135deg, ${props.color}10, ${props.color}20)`};
  border: 1px solid ${props => `${props.color}30`};
  border-radius: 16px;
  padding: 20px;
  text-align: center;
`;

const KPIValue = styled.div<{ color: string }>`
  font-size: 24px;
  font-weight: 700;
  color: ${props => props.color};
  margin-bottom: 8px;
`;

const KPILabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
`;

const ChartsGrid = styled.div<{ columns: number }>`
  display: grid;
  grid-template-columns: repeat(${props => props.columns}, 1fr);
  gap: 24px;
  margin-bottom: 24px;
`;

const ChartCard = styled.div`
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
`;

const ChartTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 16px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InsightCard = styled.div<{ color: string }>`
  background: ${props => `linear-gradient(135deg, ${props.color}05, ${props.color}10)`};
  border: 1px solid ${props => `${props.color}20`};
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
`;

const InsightTitle = styled.h4<{ color: string }>`
  font-size: 16px;
  font-weight: 600;
  color: ${props => props.color};
  margin: 0 0 8px 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const InsightText = styled.p`
  font-size: 14px;
  color: #4b5563;
  margin: 0;
  line-height: 1.5;
`;

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  pink: '#ec4899'
};

const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return '€0';
  if (value >= 1e9) return `€${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `€${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `€${(value / 1e3).toFixed(1)}K`;
  return `€${value.toFixed(2)}`;
};

const formatPercent = (value: number | null | undefined): string => {
  if (!value && value !== 0) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const ComprehensiveInsights: React.FC<ComprehensiveInsightsProps> = ({ 
  companies, 
  selectedCompanyIds 
}) => {
  const [activeTab, setActiveTab] = useState<'financial' | 'valuation' | 'performance' | 'future'>('financial');

  const filteredCompanies = useMemo(() => {
    return selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies;
  }, [companies, selectedCompanyIds]);

  // Financial KPIs
  const kpis = useMemo(() => {
    const validCompanies = filteredCompanies.filter(c => c.marketCapEur);
    const totalMarketCap = validCompanies.reduce((sum, c) => sum + (c.marketCapEur || 0), 0);
    const avgPE = validCompanies.filter(c => c.peRatio).reduce((sum, c) => sum + (c.peRatio || 0), 0) / validCompanies.filter(c => c.peRatio).length;
    const avgEPS = validCompanies.filter(c => c.eps).reduce((sum, c) => sum + (c.eps || 0), 0) / validCompanies.filter(c => c.eps).length;
    const avgChange = validCompanies.filter(c => c.changePercent !== null).reduce((sum, c) => sum + (c.changePercent || 0), 0) / validCompanies.filter(c => c.changePercent !== null).length;
    const highPerformers = validCompanies.filter(c => (c.changePercent || 0) > 0).length;

    return {
      totalMarketCap,
      avgPE: avgPE || 0,
      avgEPS: avgEPS || 0,
      avgChange: avgChange || 0,
      highPerformers,
      companiesCount: validCompanies.length
    };
  }, [filteredCompanies]);

  // PE Ratio Distribution
  const peDistribution = useMemo(() => {
    const ranges = [
      { range: '0-10', min: 0, max: 10, count: 0 },
      { range: '10-15', min: 10, max: 15, count: 0 },
      { range: '15-20', min: 15, max: 20, count: 0 },
      { range: '20-25', min: 20, max: 25, count: 0 },
      { range: '25+', min: 25, max: Infinity, count: 0 }
    ];

    filteredCompanies.forEach(company => {
      const pe = company.peRatio;
      if (pe) {
        const range = ranges.find(r => pe >= r.min && pe < r.max);
        if (range) range.count++;
      }
    });

    return ranges.filter(r => r.count > 0);
  }, [filteredCompanies]);

  // 52-Week Range Analysis
  const priceRangeData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.high52 && c.low52 && c.currentPriceEur)
      .map(company => {
        const range = (company.high52! - company.low52!);
        const position = ((company.currentPriceEur - company.low52!) / range) * 100;
        return {
          name: company.company.length > 10 ? company.company.substring(0, 10) + '...' : company.company,
          high: company.high52,
          low: company.low52,
          current: company.currentPriceEur,
          position,
          range
        };
      })
      .sort((a, b) => b.position - a.position)
      .slice(0, 15);
  }, [filteredCompanies]);

  // Volume vs Market Cap Analysis
  const volumeMarketCapData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.volumeEur && c.marketCapEur)
      .map(company => ({
        x: (company.volumeEur || 0) / 1e6, // Volume in millions
        y: (company.marketCapEur || 0) / 1e9, // Market cap in billions
        name: company.company,
        turnover: ((company.volumeEur || 0) / (company.marketCapEur || 1)) * 100 // Turnover rate
      }));
  }, [filteredCompanies]);

  // Smart Insights Generation
  const insights = useMemo(() => {
    const insights = [];
    
    // Financial Health Insights
    if (kpis.avgPE > 0) {
      if (kpis.avgPE < 15) {
        insights.push({
          type: 'success',
          title: 'Attractive Valuation',
          text: `Average P/E ratio of ${kpis.avgPE.toFixed(1)} suggests potentially undervalued companies with good growth prospects.`
        });
      } else if (kpis.avgPE > 25) {
        insights.push({
          type: 'warning',
          title: 'High Valuation Alert',
          text: `Average P/E ratio of ${kpis.avgPE.toFixed(1)} indicates high expectations. Monitor for growth delivery.`
        });
      }
    }

    // Performance Insights
    const strongPerformers = filteredCompanies.filter(c => (c.changePercent || 0) > 5);
    if (strongPerformers.length > 0) {
      insights.push({
        type: 'success',
        title: 'Strong Performers Identified',
        text: `${strongPerformers.length} companies showing >5% growth: ${strongPerformers.slice(0, 3).map(c => c.company).join(', ')}${strongPerformers.length > 3 ? '...' : ''}`
      });
    }

    // EPS Leaders
    const epsLeaders = filteredCompanies.filter(c => (c.eps || 0) > kpis.avgEPS).slice(0, 3);
    if (epsLeaders.length > 0) {
      insights.push({
        type: 'primary',
        title: 'EPS Leaders',
        text: `Top earnings performers: ${epsLeaders.map(c => `${c.company} (€${c.eps?.toFixed(2)})`).join(', ')}`
      });
    }

    // Market Concentration
    const largeCapCount = filteredCompanies.filter(c => (c.marketCapEur || 0) > 50e9).length;
    if (largeCapCount > 0) {
      insights.push({
        type: 'purple',
        title: 'Market Concentration',
        text: `${largeCapCount} large-cap companies (>€50B) represent significant market weight in your selection.`
      });
    }

    return insights;
  }, [filteredCompanies, kpis]);

  const renderFinancialTab = () => (
    <>
      <KPIGrid>
        <KPICard color={COLORS.primary}>
          <KPIValue color={COLORS.primary}>{formatCurrency(kpis.totalMarketCap)}</KPIValue>
          <KPILabel>Total Market Cap</KPILabel>
        </KPICard>
        <KPICard color={COLORS.success}>
          <KPIValue color={COLORS.success}>{kpis.avgPE.toFixed(1)}</KPIValue>
          <KPILabel>Avg P/E Ratio</KPILabel>
        </KPICard>
        <KPICard color={COLORS.teal}>
          <KPIValue color={COLORS.teal}>€{kpis.avgEPS.toFixed(2)}</KPIValue>
          <KPILabel>Avg EPS</KPILabel>
        </KPICard>
        <KPICard color={kpis.avgChange >= 0 ? COLORS.success : COLORS.danger}>
          <KPIValue color={kpis.avgChange >= 0 ? COLORS.success : COLORS.danger}>
            {formatPercent(kpis.avgChange)}
          </KPIValue>
          <KPILabel>Avg Change</KPILabel>
        </KPICard>
        <KPICard color={COLORS.purple}>
          <KPIValue color={COLORS.purple}>{kpis.highPerformers}</KPIValue>
          <KPILabel>Positive Performers</KPILabel>
        </KPICard>
      </KPIGrid>

      <ChartsGrid columns={2}>
        <ChartCard>
          <ChartTitle>
            <TrendingUp size={20} color={COLORS.primary} />
            P/E Ratio Distribution
          </ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={peDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>
            <Activity size={20} color={COLORS.success} />
            Volume vs Market Cap
          </ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={volumeMarketCapData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis type="number" dataKey="x" name="Volume (M€)" />
              <YAxis type="number" dataKey="y" name="Market Cap (B€)" />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'x' ? `€${value}M` : `€${value}B`,
                  name === 'x' ? 'Volume' : 'Market Cap'
                ]}
              />
              <Scatter name="Companies" dataKey="y" fill={COLORS.success} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>
    </>
  );

  const renderValuationTab = () => (
    <>
      <ChartsGrid columns={1}>
        <ChartCard>
          <ChartTitle>
            <ArrowUp size={20} color={COLORS.warning} />
            52-Week Price Position Analysis
          </ChartTitle>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={priceRangeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="price" orientation="left" tickFormatter={(value) => `€${value}`} />
              <YAxis yAxisId="position" orientation="right" tickFormatter={(value) => `${value}%`} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'position') return [`${Number(value).toFixed(1)}%`, 'Position in Range'];
                  return [`€${Number(value).toFixed(2)}`, name === 'high' ? '52W High' : name === 'low' ? '52W Low' : 'Current'];
                }}
              />
              <Bar yAxisId="position" dataKey="position" fill={COLORS.warning} opacity={0.3} />
              <Line yAxisId="price" type="monotone" dataKey="high" stroke={COLORS.danger} strokeWidth={2} />
              <Line yAxisId="price" type="monotone" dataKey="low" stroke={COLORS.success} strokeWidth={2} />
              <Line yAxisId="price" type="monotone" dataKey="current" stroke={COLORS.primary} strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>
    </>
  );

  const renderPerformanceTab = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <ChartCard>
          <ChartTitle>
            <BarChart3 size={20} color={COLORS.purple} />
            Top Performers by EPS
          </ChartTitle>
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart 
              data={filteredCompanies
                .filter(c => c.eps !== null)
                .sort((a, b) => (b.eps || 0) - (a.eps || 0))
                .slice(0, 12)
                .map(c => ({
                  name: c.company.length > 12 ? c.company.substring(0, 12) + '...' : c.company,
                  eps: c.eps || 0,
                  pe: c.peRatio || 0
                }))
              }
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis yAxisId="eps" orientation="left" tickFormatter={(value) => `€${value}`} />
              <YAxis yAxisId="pe" orientation="right" />
              <Tooltip />
              <Bar yAxisId="eps" dataKey="eps" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
              <Line yAxisId="pe" type="monotone" dataKey="pe" stroke={COLORS.orange} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        <div>
          <ChartTitle>
            <Target size={20} color={COLORS.primary} />
            Smart Insights
          </ChartTitle>
          {insights.map((insight, index) => (
            <InsightCard key={index} color={COLORS[insight.type as keyof typeof COLORS]}>
              <InsightTitle color={COLORS[insight.type as keyof typeof COLORS]}>
                <Target size={16} />
                {insight.title}
              </InsightTitle>
              <InsightText>{insight.text}</InsightText>
            </InsightCard>
          ))}
        </div>
      </div>
    </>
  );

  const renderFutureTab = () => (
    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1))',
        borderRadius: '16px',
        padding: '40px',
        border: '2px dashed rgba(59, 130, 246, 0.3)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
        <h3 style={{ color: COLORS.primary, marginBottom: '16px' }}>Coming Soon: Advanced Analytics</h3>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          The future of your IBEX 35 analysis includes:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginTop: '32px' }}>
          <div>
            <Users size={32} color={COLORS.success} style={{ marginBottom: '12px' }} />
            <h4 style={{ color: COLORS.success }}>Shareholders Analysis</h4>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Ownership structure, institutional investors, and shareholding patterns
            </p>
          </div>
          <div>
            <Briefcase size={32} color={COLORS.warning} style={{ marginBottom: '12px' }} />
            <h4 style={{ color: COLORS.warning }}>Lobbying Insights</h4>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Political connections, lobbying activities, and regulatory influence
            </p>
          </div>
          <div>
            <MessageSquare size={32} color={COLORS.purple} style={{ marginBottom: '12px' }} />
            <h4 style={{ color: COLORS.purple }}>News Sentiment</h4>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Real-time news analysis, sentiment tracking, and market impact
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <InsightsContainer>
      <InsightsHeader>
        <HeaderLeft>
          <HeaderIcon>
            <BarChart3 size={24} color="white" />
          </HeaderIcon>
          <div>
            <HeaderTitle>Comprehensive Insights</HeaderTitle>
            <HeaderSubtitle>
              {selectedCompanyIds.size > 0 
                ? `Deep analysis of ${selectedCompanyIds.size} selected companies`
                : `Complete IBEX 35 intelligence dashboard`
              }
            </HeaderSubtitle>
          </div>
        </HeaderLeft>
      </InsightsHeader>

      <TabsContainer>
        <Tab 
          isActive={activeTab === 'financial'} 
          onClick={() => setActiveTab('financial')}
        >
          <DollarSign size={16} />
          Financial Overview
        </Tab>
        <Tab 
          isActive={activeTab === 'valuation'} 
          onClick={() => setActiveTab('valuation')}
        >
          <TrendingUp size={16} />
          Valuation Analysis
        </Tab>
        <Tab 
          isActive={activeTab === 'performance'} 
          onClick={() => setActiveTab('performance')}
        >
          <BarChart3 size={16} />
          Performance Insights
        </Tab>
        <Tab 
          isActive={activeTab === 'future'} 
          onClick={() => setActiveTab('future')}
        >
          <Target size={16} />
          Future Analytics
        </Tab>
      </TabsContainer>

      {activeTab === 'financial' && renderFinancialTab()}
      {activeTab === 'valuation' && renderValuationTab()}
      {activeTab === 'performance' && renderPerformanceTab()}
      {activeTab === 'future' && renderFutureTab()}
    </InsightsContainer>
  );
};