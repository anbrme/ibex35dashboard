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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MarketCapChartProps {
  companies: DatabaseCompany[];
  title?: string;
  height?: number;
  limit?: number;
}

export function MarketCapChart({ 
  companies, 
  title = 'Market Capitalization', 
  height = 400,
  limit = 15 
}: MarketCapChartProps) {
  const validCompanies = companies
    .filter(c => c.marketCap && c.marketCap > 0)
    .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
    .slice(0, limit);

  const labels = validCompanies.map(c => c.symbol.replace('.MC', ''));
  const data = validCompanies.map(c => (c.marketCap || 0) / 1000000000); // Convert to billions

  const getColor = (value: number, index: number) => {
    const colors = [
      'rgba(59, 130, 246, 0.8)',   // Blue
      'rgba(16, 185, 129, 0.8)',   // Green
      'rgba(245, 158, 11, 0.8)',   // Yellow
      'rgba(239, 68, 68, 0.8)',    // Red
      'rgba(139, 92, 246, 0.8)',   // Purple
    ];
    
    if (index < 3) return colors[0]; // Top 3 - Blue
    if (value >= 10) return colors[1]; // Large cap - Green
    if (value >= 2) return colors[2]; // Mid cap - Yellow
    if (value >= 0.3) return colors[3]; // Small cap - Red
    return colors[4]; // Micro cap - Purple
  };

  const getBorderColor = (value: number, index: number) => {
    if (index < 3) return 'rgba(59, 130, 246, 1)';
    if (value >= 10) return 'rgba(16, 185, 129, 1)';
    if (value >= 2) return 'rgba(245, 158, 11, 1)';
    if (value >= 0.3) return 'rgba(239, 68, 68, 1)';
    return 'rgba(139, 92, 246, 1)';
  };

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Market Cap (€B)',
        data,
        backgroundColor: data.map((value, index) => getColor(value, index)),
        borderColor: data.map((value, index) => getBorderColor(value, index)),
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
            return `${company.name}: €${value.toFixed(2)}B`;
          },
          afterLabel: (context: any) => {
            const value = context.parsed.y;
            
            let category = '';
            if (value >= 10) category = 'Large Cap';
            else if (value >= 2) category = 'Mid Cap';
            else if (value >= 0.3) category = 'Small Cap';
            else category = 'Micro Cap';
            
            return `Category: ${category}`;
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
          maxRotation: 45,
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
          callback: (value: any) => `€${value}B`,
        },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div style={{ height: `${height}px` }}>
        <Bar data={chartData} options={options} />
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Top 3</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded"></div>
          <span>Large Cap (€10B+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded"></div>
          <span>Mid Cap (€2B-10B)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded"></div>
          <span>Small Cap (€300M-2B)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded"></div>
          <span>Micro Cap (&lt;€300M)</span>
        </div>
      </div>
    </div>
  );
}