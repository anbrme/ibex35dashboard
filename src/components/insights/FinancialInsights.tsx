import React, { useMemo } from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ScatterChart, Scatter, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';

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
        percentage: ((marketCap / Object.values(sectorMap).reduce((a, b) => a + b, 0)) * 100).toFixed(1),
        color: SECTOR_COLORS[sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCompanies]);

  const scatterData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.marketCapEur && c.changePercent !== null)
      .map(company => ({
        x: company.changePercent || 0,
        y: (company.marketCapEur || 0) / 1e9, // Convert to billions
        name: company.company,
        sector: company.sector || 'Others',
        color: SECTOR_COLORS[company.sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }));
  }, [filteredCompanies]);

  const epsData = useMemo(() => {
    return filteredCompanies
      .filter(c => c.eps !== null)
      .sort((a, b) => (b.eps || 0) - (a.eps || 0))
      .slice(0, 10) // Top 10 by EPS
      .map(company => ({
        name: company.company.length > 12 ? company.company.substring(0, 12) + '...' : company.company,
        eps: company.eps || 0,
        color: SECTOR_COLORS[company.sector as keyof typeof SECTOR_COLORS] || SECTOR_COLORS.Others
      }));
  }, [filteredCompanies]);

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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{data.name}</p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            Market Cap: {formatCurrency(data.y * 1e9)}
          </p>
          <p style={{ margin: '4px 0 0 0', color: '#6b7280' }}>
            Change: {formatPercent(data.x)}
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
              <Tooltip content={<CustomTooltip />} />
              <Scatter name="Companies" dataKey="y" fill="#3b82f6" />
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
            <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'EPS']} />
            <Bar dataKey="eps" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
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