import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface MarketCapChartProps {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}

export function EChartsMarketCapChart({ companies, selectedCompanyIds }: MarketCapChartProps) {
  const chartData = useMemo(() => {
    const filteredCompanies = companies
      .filter(company => selectedCompanyIds.has(company.ticker))
      .sort((a, b) => (b.marketCapEur || 0) - (a.marketCapEur || 0))
      .slice(0, 20); // Top 20 companies

    return {
      companies: filteredCompanies.map(c => c.formattedTicker || c.ticker),
      marketCaps: filteredCompanies.map(c => (c.marketCapEur || 0) / 1e9), // Convert to billions
      rawData: filteredCompanies
    };
  }, [companies, selectedCompanyIds]);

  const option = useMemo(() => ({
    title: {
      text: 'Market Capitalization',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params: any) => {
        const data = params[0];
        const company = chartData.rawData[data.dataIndex];
        return `
          <strong>${company.company}</strong><br/>
          Ticker: ${company.ticker}<br/>
          Market Cap: €${data.value.toFixed(1)}B<br/>
          Sector: ${company.sector}
        `;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.companies,
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: '#6b7280'
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Market Cap (€B)',
      nameTextStyle: {
        color: '#6b7280',
        fontSize: 12
      },
      axisLabel: {
        formatter: '€{value}B',
        color: '#6b7280',
        fontSize: 10
      },
      axisLine: {
        lineStyle: {
          color: '#e5e7eb'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f3f4f6',
          type: 'dashed'
        }
      }
    },
    series: [
      {
        type: 'bar',
        data: chartData.marketCaps,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' }
            ]
          }
        },
        emphasis: {
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#60a5fa' },
                { offset: 1, color: '#3b82f6' }
              ]
            }
          }
        },
        animationDelay: (idx: number) => idx * 100,
        animationEasing: 'elasticOut'
      }
    ],
    animationDuration: 1000
  }), [chartData]);

  if (chartData.companies.length === 0) {
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