import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { DatabaseCompany } from '../../types/database';
import type { CompanyPrice } from '../../types/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceChartProps {
  companies: (DatabaseCompany & { latestPrice?: CompanyPrice | null })[];
  title?: string;
  height?: number;
  metric?: 'change' | 'changePercent' | 'volume';
  limit?: number;
}

export function PerformanceChart({ 
  companies, 
  title = 'Top Performers', 
  height = 400, 
  metric = 'changePercent',
  limit = 10 
}: PerformanceChartProps) {
  const validCompanies = companies
    .filter(c => c.latestPrice && c.latestPrice[metric] !== undefined)
    .sort((a, b) => (b.latestPrice![metric] || 0) - (a.latestPrice![metric] || 0))
    .slice(0, limit);

  const labels = validCompanies.map(c => c.symbol.replace('.MC', ''));
  const data = validCompanies.map(c => c.latestPrice![metric] || 0);

  const getColor = (value: number) => {
    if (value > 0) return 'rgba(16, 185, 129, 0.8)'; // Green
    if (value < 0) return 'rgba(239, 68, 68, 0.8)'; // Red
    return 'rgba(156, 163, 175, 0.8)'; // Gray
  };

  const getBorderColor = (value: number) => {
    if (value > 0) return 'rgba(16, 185, 129, 1)';
    if (value < 0) return 'rgba(239, 68, 68, 1)';
    return 'rgba(156, 163, 175, 1)';
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: getMetricLabel(metric),
        data,
        backgroundColor: data.map(getColor),
        borderColor: data.map(getBorderColor),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const company = validCompanies[context.dataIndex];
            const value = context.parsed.y;
            let formattedValue: string;
            
            switch (metric) {
              case 'changePercent':
                formattedValue = `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
                break;
              case 'change':
                formattedValue = `€${value > 0 ? '+' : ''}${value.toFixed(2)}`;
                break;
              case 'volume':
                formattedValue = value.toLocaleString();
                break;
              default:
                formattedValue = value.toString();
            }
            
            return `${company.name}: ${formattedValue}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (value: any) => {
            switch (metric) {
              case 'changePercent':
                return `${value}%`;
              case 'change':
                return `€${value}`;
              case 'volume':
                return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : value.toLocaleString();
              default:
                return value;
            }
          },
        },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
}

function getMetricLabel(metric: string): string {
  switch (metric) {
    case 'changePercent':
      return 'Change (%)';
    case 'change':
      return 'Change (€)';
    case 'volume':
      return 'Volume';
    default:
      return metric;
  }
}