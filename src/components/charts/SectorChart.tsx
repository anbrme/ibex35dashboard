import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { DatabaseCompany } from '../../types/database';

ChartJS.register(ArcElement, Tooltip, Legend);

interface SectorChartProps {
  companies: DatabaseCompany[];
  title?: string;
  height?: number;
}

export function SectorChart({ companies, title = 'Sector Distribution', height = 300 }: SectorChartProps) {
  const sectorCounts = companies.reduce((acc, company) => {
    const sector = company.sector || 'Other';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sectors = Object.keys(sectorCounts);
  const counts = Object.values(sectorCounts);

  const colors = [
    '#3B82F6', // Blue
    '#EF4444', // Red
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#EC4899', // Pink
    '#6B7280', // Gray
  ];

  const chartData = {
    labels: sectors,
    datasets: [
      {
        data: counts,
        backgroundColor: colors.slice(0, sectors.length),
        borderColor: colors.slice(0, sectors.length).map(color => color),
        borderWidth: 2,
        hoverOffset: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 12,
          font: {
            size: 12,
          },
          generateLabels: (chart: any) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label: string, i: number) => {
                const count = data.datasets[0].data[i];
                const percentage = ((count / companies.length) * 100).toFixed(1);
                return {
                  text: `${label} (${count}, ${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  strokeStyle: data.datasets[0].borderColor[i],
                  lineWidth: data.datasets[0].borderWidth,
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
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
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / companies.length) * 100).toFixed(1);
            return `${label}: ${value} companies (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-lg p-4">
      <div style={{ height: `${height}px` }}>
        <Doughnut data={chartData} options={options} />
      </div>
    </div>
  );
}