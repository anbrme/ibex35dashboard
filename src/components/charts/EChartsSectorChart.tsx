import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface SectorChartProps {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}

export function EChartsSectorChart({ companies, selectedCompanyIds }: SectorChartProps) {
  const chartData = useMemo(() => {
    const filteredCompanies = companies.filter(company => 
      selectedCompanyIds.has(company.ticker)
    );

    if (filteredCompanies.length === 0) {
      return [];
    }

    // Group companies by sector and calculate total market cap
    const sectorData = filteredCompanies.reduce((acc, company) => {
      const sector = company.sector || 'Unknown';
      if (!acc[sector]) {
        acc[sector] = {
          value: 0,
          count: 0,
          companies: []
        };
      }
      acc[sector].value += company.marketCapEur || 0;
      acc[sector].count += 1;
      acc[sector].companies.push(company.company);
      return acc;
    }, {} as Record<string, { value: number; count: number; companies: string[] }>);

    // Convert to ECharts format
    return Object.entries(sectorData).map(([sector, data]) => ({
      name: sector,
      value: data.value,
      count: data.count,
      companies: data.companies
    })).sort((a, b) => b.value - a.value);
  }, [companies, selectedCompanyIds]);

  const option = useMemo(() => ({
    title: {
      text: 'Market Cap by Sector',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => {
        const data = params.data;
        const percentage = params.percent;
        return `
          <strong>${data.name}</strong><br/>
          Market Cap: €${(data.value / 1e9).toFixed(1)}B<br/>
          Companies: ${data.count}<br/>
          Share: ${percentage.toFixed(1)}%<br/>
          <small>${data.companies.slice(0, 3).join(', ')}${data.companies.length > 3 ? '...' : ''}</small>
        `;
      }
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: 10,
      top: 20,
      bottom: 20,
      textStyle: {
        fontSize: 12
      }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 8,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold'
          },
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        labelLine: {
          show: false
        },
        data: chartData,
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: () => Math.random() * 200
      }
    ],
    color: [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
      '#8b5cf6', '#06b6d4', '#f97316', '#84cc16',
      '#ec4899', '#6366f1', '#14b8a6', '#eab308'
    ]
  }), [chartData]);

  if (chartData.length === 0) {
    return (
      <div style={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: '#6b7280',
        fontSize: '14px'
      }}>
        No companies selected
      </div>
    );
  }

  return (
    <ReactECharts
      option={option}
      style={{ width: '100%', height: '100%' }}
      opts={{ renderer: 'svg' }}
    />
  );
}