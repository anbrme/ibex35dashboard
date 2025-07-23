import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import type { CompanyPrice } from '../../types/database';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface PriceChartProps {
  data: CompanyPrice[];
  companyName: string;
  height?: number;
}

export function PriceChart({ data, companyName, height = 400 }: PriceChartProps) {
  const sortedData = [...data].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const chartData = {
    labels: sortedData.map(d => d.timestamp),
    datasets: [
      {
        label: 'Price (€)',
        data: sortedData.map(d => d.price),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${companyName} - Price Chart`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: any) => {
            return `Price: €${context.parsed.y.toFixed(2)}`;
          },
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
        },
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
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          font: {
            size: 11,
          },
          callback: (value: any) => `€${value.toFixed(2)}`,
        },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div style={{ height: `${height}px` }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}