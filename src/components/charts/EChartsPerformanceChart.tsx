import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface PerformanceChartProps {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}

export function EChartsPerformanceChart({ companies, selectedCompanyIds }: PerformanceChartProps) {
  const chartData = useMemo(() => {
    const filteredCompanies = companies
      .filter(company => 
        selectedCompanyIds.has(company.ticker) && 
        company.changePercent !== undefined
      )
      .sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0));

    return {
      companies: filteredCompanies.map(c => c.formattedTicker || c.ticker),
      performance: filteredCompanies.map(c => c.changePercent || 0),
      rawData: filteredCompanies
    };
  }, [companies, selectedCompanyIds]);

  const option = useMemo(() => ({
    title: {
      text: 'Price Performance (%)',
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
          Change: ${data.value > 0 ? '+' : ''}${data.value.toFixed(2)}%<br/>
          Price: €${company.currentPriceEur?.toFixed(2) || 'N/A'}<br/>
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
      name: 'Change (%)',
      nameTextStyle: {
        color: '#6b7280',
        fontSize: 12
      },
      axisLabel: {
        formatter: '{value}%',
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
        data: chartData.performance.map((value) => ({
          value,
          itemStyle: {
            borderRadius: value >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
            color: value >= 0 
              ? {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: '#10b981' },
                    { offset: 1, color: '#059669' }
                  ]
                }
              : {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: '#ef4444' },
                    { offset: 1, color: '#dc2626' }
                  ]
                }
          }
        })),
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        },
        animationDelay: (idx: number) => idx * 50,
        animationEasing: 'elasticOut'
      }
    ],
    animationDuration: 1000,
    // Add a reference line at 0%
    markLine: {
      data: [
        {
          yAxis: 0,
          lineStyle: {
            color: '#6b7280',
            type: 'solid',
            width: 1
          },
          label: {
            show: false
          }
        }
      ]
    }
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
        No performance data available
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