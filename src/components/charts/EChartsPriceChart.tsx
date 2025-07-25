import { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface PriceChartProps {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}

export function EChartsPriceChart({ companies, selectedCompanyIds }: PriceChartProps) {
  const chartData = useMemo(() => {
    const filteredCompanies = companies
      .filter(company => 
        selectedCompanyIds.has(company.ticker) && 
        company.currentPriceEur !== undefined
      )
      .sort((a, b) => (b.currentPriceEur || 0) - (a.currentPriceEur || 0));

    return {
      companies: filteredCompanies.map(c => c.formattedTicker || c.ticker),
      prices: filteredCompanies.map(c => c.currentPriceEur || 0),
      changes: filteredCompanies.map(c => c.changePercent || 0),
      rawData: filteredCompanies
    };
  }, [companies, selectedCompanyIds]);

  const option = useMemo(() => ({
    title: {
      text: 'Current Stock Prices',
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
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: (params: any) => {
        const priceData = params[0];
        const changeData = params[1];
        const company = chartData.rawData[priceData.dataIndex];
        return `
          <strong>${company.company}</strong><br/>
          Ticker: ${company.ticker}<br/>
          Price: €${priceData.value.toFixed(2)}<br/>
          Change: ${changeData.value > 0 ? '+' : ''}${changeData.value.toFixed(2)}%<br/>
          Market Cap: €${((company.marketCapEur || 0) / 1e9).toFixed(1)}B<br/>
          Sector: ${company.sector}
        `;
      }
    },
    legend: {
      data: ['Price (€)', 'Change (%)'],
      top: 50
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: [
      {
        type: 'category',
        data: chartData.companies,
        axisPointer: {
          type: 'shadow'
        },
        axisLabel: {
          rotate: 45,
          fontSize: 10,
          color: '#6b7280'
        }
      }
    ],
    yAxis: [
      {
        type: 'value',
        name: 'Price (€)',
        nameTextStyle: {
          color: '#6b7280'
        },
        axisLabel: {
          formatter: '€{value}',
          color: '#6b7280'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#3b82f6'
          }
        }
      },
      {
        type: 'value',
        name: 'Change (%)',
        nameTextStyle: {
          color: '#6b7280'
        },
        axisLabel: {
          formatter: '{value}%',
          color: '#6b7280'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: '#10b981'
          }
        }
      }
    ],
    series: [
      {
        name: 'Price (€)',
        type: 'bar',
        yAxisIndex: 0,
        data: chartData.prices,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' }
            ]
          }
        },
        animationDelay: (idx: number) => idx * 100
      },
      {
        name: 'Change (%)',
        type: 'line',
        yAxisIndex: 1,
        data: chartData.changes.map(value => ({
          value,
          itemStyle: {
            color: value >= 0 ? '#10b981' : '#ef4444'
          },
          lineStyle: {
            color: value >= 0 ? '#10b981' : '#ef4444'
          }
        })),
        lineStyle: {
          width: 3
        },
        symbol: 'circle',
        symbolSize: 6,
        emphasis: {
          scale: true,
          symbolSize: 8
        },
        animationDelay: (idx: number) => idx * 50 + 500
      }
    ],
    animationDuration: 1000,
    animationEasing: 'elasticOut'
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
        No price data available
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