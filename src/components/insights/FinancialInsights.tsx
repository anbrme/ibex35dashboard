import React, { useMemo } from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ScatterChart, Scatter, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface FinancialInsightsProps {
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

const InsightsHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
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

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
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
`;

const MetricsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-bottom: 24px;
`;

const MetricCard = styled.div`
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(29, 78, 216, 0.1));
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
`;

const MetricValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #3b82f6;
  margin-bottom: 8px;
`;

const MetricLabel = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
`;

const TableContainer = styled.div`
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.1);
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 12px 16px;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid rgba(0, 0, 0, 0.1);
  background: rgba(59, 130, 246, 0.05);
`;

const TableRow = styled.tr`
  &:nth-child(even) {
    background: rgba(0, 0, 0, 0.02);
  }
  
  &:hover {
    background: rgba(59, 130, 246, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
`;

const CompanyName = styled.span`
  font-weight: 600;
  color: #1f2937;
`;

const Ticker = styled.span`
  font-family: monospace;
  background: rgba(59, 130, 246, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  color: #3b82f6;
`;

const ColorLegend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 16px;
  background: rgba(0, 0, 0, 0.02);
  border-radius: 8px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
`;

const ColorDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
`;

// Sector colors for consistency
const SECTOR_COLORS = {
  'Financial Services': '#3b82f6',
  'Energy': '#f59e0b',
  'Construction': '#8b5cf6',
  'Real Estate': '#10b981',
  'Telecommunications': '#06b6d4',
  'Steel': '#f97316',
  'Pharmaceuticals': '#ec4899',
  'Aviation': '#6366f1',
  'Infrastructure': '#14b8a6',
  'Others': '#9ca3af'
};

// Company-specific colors for multi-selection
const COMPANY_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#14b8a6',
  '#84cc16', '#f43f5e', '#a855f7', '#0ea5e9', '#22c55e',
  '#fb923c', '#e11d48', '#7c3aed', '#0284c7', '#16a34a'
];

const formatCurrency = (value: number | null | undefined): string => {
  if (!value) return '€0';
  if (value >= 1e9) return `€${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `€${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `€${(value / 1e3).toFixed(1)}K`;
  return `€${value.toFixed(2)}`;
};

const formatPercent = (value: number | null | undefined): string => {
  if (!value) return '0%';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const FinancialInsights: React.FC<FinancialInsightsProps> = ({ 
  companies, 
  selectedCompanyIds 
}) => {
  const filteredCompanies = useMemo(() => {
    return selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies;
  }, [companies, selectedCompanyIds]);

  const sectorData = useMemo(() => {
    const sectorMap = filteredCompanies.reduce((acc, company) => {
      const sector = company.sector || 'Others';
      acc[sector] = (acc[sector] || 0) + (company.marketCapEur || 0);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(sectorMap)
      .map(([sector, marketCap]) => ({
        name: sector,
        value: marketCap,
        percentage: ((marketCap / Object.values(sectorMap).reduce((a: number, b: number) => a + b, 0)) * 100).toFixed(1),
        color: SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCompanies]);

  const scatterData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.marketCapEur && c.changePercent !== null)
      .map((company, index) => ({
        x: company.changePercent || 0,
        y: (company.marketCapEur || 0) / 1e9, // Convert to billions
        name: company.company,
        ticker: company.ticker,
        sector: company.sector || 'Others',
        marketCap: company.marketCapEur || 0,
        changePercent: company.changePercent || 0,
        currentPrice: company.currentPriceEur,
        color: selectedCompanyIds.size > 1 
          ? COMPANY_COLORS[index % COMPANY_COLORS.length]
          : SECTOR_COLORS[company.sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }));
  }, [filteredCompanies, selectedCompanyIds.size]);

  const epsData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.eps !== null)
      .sort((a, b) => (b.eps || 0) - (a.eps || 0))
      .slice(0, 10) // Top 10 by EPS
      .map((company, index) => ({
        name: company.company.length > 12 ? company.company.substring(0, 12) + '...' : company.company,
        fullName: company.company,
        ticker: company.ticker,
        eps: company.eps || 0,
        peRatio: company.peRatio || 0,
        changePercent: company.changePercent || 0,
        color: selectedCompanyIds.size > 1 
          ? COMPANY_COLORS[index % COMPANY_COLORS.length]
          : SECTOR_COLORS[company.sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }));
  }, [filteredCompanies, selectedCompanyIds.size]);

  // P/E vs EPS Relationship
  const valuationData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.eps && c.peRatio)
      .map((company, index) => ({
        x: company.eps || 0,
        y: company.peRatio || 0,
        name: company.company,
        ticker: company.ticker,
        sector: company.sector,
        marketCap: company.marketCapEur || 0,
        changePercent: company.changePercent || 0,
        color: selectedCompanyIds.size > 1 
          ? COMPANY_COLORS[index % COMPANY_COLORS.length]
          : SECTOR_COLORS[company.sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }));
  }, [filteredCompanies, selectedCompanyIds.size]);

  // 52-Week Performance Position
  const performanceRangeData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.high52 && c.low52 && c.currentPriceEur)
      .map((company, index) => {
        const range = (company.high52! - company.low52!);
        const position = range > 0 ? ((company.currentPriceEur - company.low52!) / range) * 100 : 50;
        return {
          name: company.company.length > 15 ? company.company.substring(0, 15) + '...' : company.company,
          fullName: company.company,
          ticker: company.ticker,
          position,
          low: company.low52,
          high: company.high52,
          current: company.currentPriceEur,
          changePercent: company.changePercent || 0,
          color: selectedCompanyIds.size > 1 
            ? COMPANY_COLORS[index % COMPANY_COLORS.length]
            : (position > 70 ? '#10b981' : position < 30 ? '#ef4444' : '#f59e0b')
        };
      })
      .sort((a, b) => b.position - a.position);
  }, [filteredCompanies, selectedCompanyIds.size]);

  // Market Performance Quadrants (P/E vs Change%)
  const quadrantData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.peRatio && c.changePercent !== null)
      .map((company, index) => ({
        x: company.changePercent || 0,
        y: company.peRatio || 0,
        name: company.company,
        ticker: company.ticker,
        sector: company.sector,
        marketCap: company.marketCapEur || 0,
        eps: company.eps || 0,
        color: selectedCompanyIds.size > 1 
          ? COMPANY_COLORS[index % COMPANY_COLORS.length]
          : SECTOR_COLORS[company.sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }));
  }, [filteredCompanies, selectedCompanyIds.size]);

  const aggregateMetrics = useMemo(() => {
    const validCompanies = filteredCompanies.filter(c => c.marketCapEur);
    const totalMarketCap = validCompanies.reduce((sum, c) => sum + (c.marketCapEur || 0), 0);
    const avgPE = validCompanies.filter(c => c.peRatio).reduce((sum, c) => sum + (c.peRatio || 0), 0) / validCompanies.filter(c => c.peRatio).length;
    const avgEPS = validCompanies.filter(c => c.eps).reduce((sum, c) => sum + (c.eps || 0), 0) / validCompanies.filter(c => c.eps).length;

    return {
      totalMarketCap,
      avgPE: avgPE || 0,
      avgEPS: avgEPS || 0,
      companiesCount: validCompanies.length
    };
  }, [filteredCompanies]);

  const CustomScatterTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: '200px'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{data.name}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>({data.ticker})</p>
          <p style={{ margin: '6px 0 2px 0', color: '#374151' }}>
            Market Cap: {formatCurrency(data.marketCap)}
          </p>
          <p style={{ margin: '2px 0', color: data.changePercent >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
            Change: {formatPercent(data.changePercent)}
          </p>
          <p style={{ margin: '2px 0 0 0', color: '#6b7280' }}>
            Current Price: {formatCurrency(data.currentPrice)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: '200px'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{data.fullName}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>({data.ticker})</p>
          <p style={{ margin: '6px 0 2px 0', color: '#374151' }}>
            EPS: €{data.eps?.toFixed(2)}
          </p>
          <p style={{ margin: '2px 0', color: '#6b7280' }}>
            P/E Ratio: {data.peRatio?.toFixed(1) || 'N/A'}
          </p>
          <p style={{ margin: '2px 0 0 0', color: data.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
            Change: {formatPercent(data.changePercent)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomValuationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: '200px'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{data.name}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>({data.ticker})</p>
          <p style={{ margin: '6px 0 2px 0', color: '#374151' }}>
            EPS: €{data.x?.toFixed(2)}
          </p>
          <p style={{ margin: '2px 0', color: '#6b7280' }}>
            P/E Ratio: {data.y?.toFixed(1)}
          </p>
          <p style={{ margin: '2px 0', color: '#6b7280' }}>
            Market Cap: {formatCurrency(data.marketCap)}
          </p>
          <p style={{ margin: '2px 0 0 0', color: data.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
            Change: {formatPercent(data.changePercent)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomRangeTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
          maxWidth: '200px'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#1f2937' }}>{data.fullName}</p>
          <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>({data.ticker})</p>
          <p style={{ margin: '6px 0 2px 0', color: '#374151' }}>
            Position: {data.position?.toFixed(1)}% of 52W range
          </p>
          <p style={{ margin: '2px 0', color: '#6b7280' }}>
            Current: {formatCurrency(data.current)}
          </p>
          <p style={{ margin: '2px 0', color: '#10b981' }}>
            52W High: {formatCurrency(data.high)}
          </p>
          <p style={{ margin: '2px 0', color: '#ef4444' }}>
            52W Low: {formatCurrency(data.low)}
          </p>
          <p style={{ margin: '2px 0 0 0', color: data.changePercent >= 0 ? '#10b981' : '#ef4444' }}>
            Change: {formatPercent(data.changePercent)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <InsightsContainer>
      <InsightsHeader>
        <HeaderIcon>
          <BarChart3 size={24} color="white" />
        </HeaderIcon>
        <div>
          <HeaderTitle>Financial Insights</HeaderTitle>
          <HeaderSubtitle>
            {selectedCompanyIds.size > 0 
              ? `Analysis of ${selectedCompanyIds.size} selected companies`
              : `Complete IBEX 35 analysis (${companies.length} companies)`
            }
          </HeaderSubtitle>
        </div>
      </InsightsHeader>

      <MetricsRow>
        <MetricCard>
          <MetricValue>{formatCurrency(aggregateMetrics.totalMarketCap)}</MetricValue>
          <MetricLabel>Total Market Cap</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>{aggregateMetrics.avgPE.toFixed(1)}</MetricValue>
          <MetricLabel>Average P/E Ratio</MetricLabel>
        </MetricCard>
        <MetricCard>
          <MetricValue>€{aggregateMetrics.avgEPS.toFixed(2)}</MetricValue>
          <MetricLabel>Average EPS</MetricLabel>
        </MetricCard>
      </MetricsRow>

      {selectedCompanyIds.size > 1 && (
        <ColorLegend>
          <strong style={{ marginRight: '8px' }}>Selected Companies:</strong>
          {filteredCompanies.map((company, index) => (
            <LegendItem key={company.ticker}>
              <ColorDot color={COMPANY_COLORS[index % COMPANY_COLORS.length]} />
              <span>{company.company}</span>
              <Ticker>{company.ticker}</Ticker>
            </LegendItem>
          ))}
        </ColorLegend>
      )}

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>Market Cap by Sector</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percentage }) => `${name} (${percentage}%)`}
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Market Cap']}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>Market Cap vs Price Change %</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={scatterData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Price Change %" 
                domain={['dataMin - 2', 'dataMax + 2']}
                tickFormatter={(value) => `${value}%`}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Market Cap (B€)" 
                tickFormatter={(value) => `${value}B`}
              />
              <Tooltip content={<CustomScatterTooltip />} />
              <Scatter name="Companies" dataKey="y">
                {scatterData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>

      <ChartCard>
        <ChartTitle>Top Companies by EPS (Earnings Per Share)</ChartTitle>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={epsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
            <YAxis tickFormatter={(value) => `€${value}`} />
            <Tooltip content={<CustomBarTooltip />} />
            {selectedCompanyIds.size > 1 ? (
              <Bar dataKey="eps" radius={[4, 4, 0, 0]}>
                {epsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            ) : (
              <Bar dataKey="eps" fill="#10b981" radius={[4, 4, 0, 0]} />
            )}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartsGrid>
        <ChartCard>
          <ChartTitle>P/E Ratio vs EPS Relationship</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={valuationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="EPS (€)" 
                tickFormatter={(value) => `€${value}`}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="P/E Ratio" 
              />
              <Tooltip content={<CustomValuationTooltip />} />
              <Scatter name="Companies" dataKey="y">
                {valuationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard>
          <ChartTitle>52-Week Price Position</ChartTitle>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceRangeData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={(value) => `${value}%`} />
              <Tooltip content={<CustomRangeTooltip />} />
              {selectedCompanyIds.size > 1 ? (
                <Bar dataKey="position" radius={[4, 4, 0, 0]}>
                  {performanceRangeData.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              ) : (
                <Bar dataKey="position" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </ChartsGrid>

      <ChartCard>
        <ChartTitle>Market Performance Quadrants (Value vs Growth)</ChartTitle>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={quadrantData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Price Change %" 
              domain={['dataMin - 1', 'dataMax + 1']}
              tickFormatter={(value) => `${value}%`}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="P/E Ratio"
              domain={['dataMin - 2', 'dataMax + 2']}
            />
            <Tooltip content={<CustomValuationTooltip />} />
            <Scatter name="Companies" dataKey="y">
              {quadrantData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Scatter>
            {/* Reference lines for quadrants */}
            <line x1="0%" y1="0%" x2="0%" y2="100%" stroke="#94a3b8" strokeDasharray="5,5" />
            <line x1="0%" y1="20" x2="100%" y2="20" stroke="#94a3b8" strokeDasharray="5,5" />
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '16px', 
          marginTop: '16px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
            <strong style={{ color: '#10b981' }}>Value + Growth</strong><br/>
            Low P/E + Positive Change
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
            <strong style={{ color: '#f59e0b' }}>Expensive Growth</strong><br/>
            High P/E + Positive Change
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
            <strong style={{ color: '#3b82f6' }}>Undervalued</strong><br/>
            Low P/E + Negative Change
          </div>
          <div style={{ textAlign: 'center', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
            <strong style={{ color: '#ef4444' }}>Risky</strong><br/>
            High P/E + Negative Change
          </div>
        </div>
      </ChartCard>

      <TableContainer>
        <ChartTitle>Detailed Financial Metrics</ChartTitle>
        <Table>
          <thead>
            <tr>
              <TableHeader>Company</TableHeader>
              <TableHeader>Ticker</TableHeader>
              <TableHeader>Sector</TableHeader>
              <TableHeader>Current Price</TableHeader>
              <TableHeader>Change %</TableHeader>
              <TableHeader>P/E Ratio</TableHeader>
              <TableHeader>EPS</TableHeader>
              <TableHeader>Market Cap</TableHeader>
            </tr>
          </thead>
          <tbody>
            {filteredCompanies
              .sort((a, b) => (b.marketCapEur || 0) - (a.marketCapEur || 0))
              .map((company) => (
                <TableRow key={company.ticker}>
                  <TableCell>
                    <CompanyName>{company.company}</CompanyName>
                  </TableCell>
                  <TableCell>
                    <Ticker>{company.ticker}</Ticker>
                  </TableCell>
                  <TableCell>{company.sector}</TableCell>
                  <TableCell>{formatCurrency(company.currentPriceEur)}</TableCell>
                  <TableCell style={{ 
                    color: (company.changePercent || 0) >= 0 ? '#10b981' : '#ef4444' 
                  }}>
                    {formatPercent(company.changePercent)}
                  </TableCell>
                  <TableCell>{company.peRatio?.toFixed(1) || 'N/A'}</TableCell>
                  <TableCell>€{company.eps?.toFixed(2) || 'N/A'}</TableCell>
                  <TableCell>{formatCurrency(company.marketCapEur)}</TableCell>
                </TableRow>
              ))}
          </tbody>
        </Table>
      </TableContainer>
    </InsightsContainer>
  );
};