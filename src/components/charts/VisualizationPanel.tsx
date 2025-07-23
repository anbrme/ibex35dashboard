import { useState } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement, RadialLinearScale } from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import { BarChart3, PieChart, TrendingUp, Network, Users, Building2 } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';
import { NetworkGraph } from './NetworkGraph';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  RadialLinearScale
);

interface VisualizationPanelProps {
  companies: SecureIBEXCompanyData[];
  selectedCompany: SecureIBEXCompanyData | null;
}

type ChartType = 'overview' | 'sectors' | 'performance' | 'network';

export function VisualizationPanel({ companies, selectedCompany }: VisualizationPanelProps) {
  const [activeChart, setActiveChart] = useState<ChartType>('overview');

  // Chart theme configuration
  const chartTheme = {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.8)',
    pointBackgroundColor: 'rgba(245, 158, 11, 1)',
    gridColor: 'rgba(255, 255, 255, 0.1)',
    textColor: 'rgba(255, 255, 255, 0.8)',
  };

  // Filter data based on selection
  const displayData = selectedCompany ? [selectedCompany] : companies;
  const isFiltered = !!selectedCompany;

  // Market Cap Distribution Chart
  const getMarketCapData = () => {
    if (isFiltered) {
      // Individual company metrics over time (mock data for demo)
      return {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{
          label: 'Market Cap (€B)',
          data: [
            selectedCompany!.marketCapEur / 1e9 * 0.9,
            selectedCompany!.marketCapEur / 1e9 * 0.95,
            selectedCompany!.marketCapEur / 1e9 * 1.05,
            selectedCompany!.marketCapEur / 1e9
          ],
          backgroundColor: chartTheme.backgroundColor,
          borderColor: chartTheme.borderColor,
          borderWidth: 2,
        }]
      };
    }

    // Top 10 companies by market cap
    const topCompanies = companies
      .sort((a, b) => b.marketCapEur - a.marketCapEur)
      .slice(0, 10);

    return {
      labels: topCompanies.map(c => c.company.length > 12 ? c.company.substring(0, 12) + '...' : c.company),
      datasets: [{
        label: 'Market Cap (€B)',
        data: topCompanies.map(c => c.marketCapEur / 1e9),
        backgroundColor: topCompanies.map((_, i) => `rgba(245, 158, 11, ${0.8 - i * 0.05})`),
        borderColor: chartTheme.borderColor,
        borderWidth: 1,
      }]
    };
  };

  // Sector Distribution Chart
  const getSectorData = () => {
    if (isFiltered) {
      // Show company's sector context
      const companySector = selectedCompany!.sector;
      const sectorCompanies = companies.filter(c => c.sector === companySector);
      
      return {
        labels: sectorCompanies.map(c => c.company.length > 10 ? c.company.substring(0, 10) + '...' : c.company),
        datasets: [{
          label: 'Market Cap (€B)',
          data: sectorCompanies.map(c => c.marketCapEur / 1e9),
          backgroundColor: sectorCompanies.map((c, i) => 
            c.ticker === selectedCompany!.ticker 
              ? 'rgba(245, 158, 11, 1)' 
              : `rgba(245, 158, 11, ${0.3 + i * 0.1})`
          ),
          borderColor: chartTheme.borderColor,
          borderWidth: 2,
        }]
      };
    }

    // All sectors distribution
    const sectorDistribution = companies.reduce((acc, company) => {
      acc[company.sector] = (acc[company.sector] || 0) + company.marketCapEur;
      return acc;
    }, {} as Record<string, number>);

    const sectors = Object.keys(sectorDistribution);
    const sectorColors = [
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)',
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(147, 51, 234, 0.8)',
      'rgba(236, 72, 153, 0.8)',
      'rgba(20, 184, 166, 0.8)',
      'rgba(251, 146, 60, 0.8)',
    ];

    return {
      labels: sectors,
      datasets: [{
        data: Object.values(sectorDistribution).map(v => v / 1e9),
        backgroundColor: sectorColors.slice(0, sectors.length),
        borderColor: sectorColors.slice(0, sectors.length).map(c => c.replace('0.8', '1')),
        borderWidth: 2,
      }]
    };
  };

  // Performance Radar Chart
  const getPerformanceData = () => {
    if (isFiltered) {
      const company = selectedCompany!;
      // Normalize metrics for radar chart (0-100 scale)
      const marketCapScore = Math.min((company.marketCapEur / 1e11) * 100, 100);
      const volumeScore = Math.min((company.volumeEur / 1e7) * 100, 100);
      const priceScore = Math.min((company.currentPriceEur / 100) * 100, 100);
      const directorsScore = Math.min((company.directors.length / 15) * 100, 100);

      return {
        labels: ['Market Cap', 'Volume', 'Price', 'Directors', 'Sector Position'],
        datasets: [{
          label: company.company,
          data: [marketCapScore, volumeScore, priceScore, directorsScore, 75], // Mock sector position
          backgroundColor: 'rgba(245, 158, 11, 0.2)',
          borderColor: 'rgba(245, 158, 11, 1)',
          pointBackgroundColor: 'rgba(245, 158, 11, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(245, 158, 11, 1)',
        }]
      };
    }

    // Average performance metrics (for future use)
    // const avgMarketCap = companies.reduce((sum, c) => sum + c.marketCapEur, 0) / companies.length;
    // const avgVolume = companies.reduce((sum, c) => sum + c.volumeEur, 0) / companies.length;
    // const avgPrice = companies.reduce((sum, c) => sum + c.currentPriceEur, 0) / companies.length;
    // const avgDirectors = companies.reduce((sum, c) => sum + c.directors.length, 0) / companies.length;

    return {
      labels: ['Avg Market Cap', 'Avg Volume', 'Avg Price', 'Avg Directors', 'Market Health'],
      datasets: [{
        label: 'IBEX 35 Average',
        data: [60, 45, 30, 40, 80], // Normalized scores
        backgroundColor: 'rgba(245, 158, 11, 0.2)',
        borderColor: 'rgba(245, 158, 11, 1)',
        pointBackgroundColor: 'rgba(245, 158, 11, 1)',
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTheme.textColor,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
      }
    },
    scales: {
      x: {
        grid: {
          color: chartTheme.gridColor,
        },
        ticks: {
          color: chartTheme.textColor,
        }
      },
      y: {
        grid: {
          color: chartTheme.gridColor,
        },
        ticks: {
          color: chartTheme.textColor,
        }
      }
    }
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: chartTheme.textColor,
        }
      }
    },
    scales: {
      r: {
        grid: {
          color: chartTheme.gridColor,
        },
        pointLabels: {
          color: chartTheme.textColor,
        },
        ticks: {
          color: chartTheme.textColor,
          backdropColor: 'transparent',
        }
      }
    }
  };

  const chartTabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'sectors', label: 'Sectors', icon: PieChart },
    { id: 'performance', label: 'Performance', icon: TrendingUp },
    { id: 'network', label: 'Network', icon: Network },
  ] as const;

  return (
    <div className="flex-1 flex flex-col">
      {/* Chart Navigation */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            {isFiltered ? `${selectedCompany!.company} Analysis` : 'IBEX 35 Overview'}
          </h2>
          {isFiltered && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4" />
              <span>{selectedCompany!.sector}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {chartTabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveChart(id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeChart === id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 p-6">
        {activeChart === 'overview' && (
          <div className="h-full">
            <h3 className="text-md font-medium mb-4">
              {isFiltered ? 'Quarterly Performance' : 'Top Companies by Market Cap'}
            </h3>
            <div className="h-96">
              <Bar data={getMarketCapData()} options={chartOptions} />
            </div>
          </div>
        )}

        {activeChart === 'sectors' && (
          <div className="h-full">
            <h3 className="text-md font-medium mb-4">
              {isFiltered ? `${selectedCompany!.sector} Sector Companies` : 'Sector Distribution'}
            </h3>
            <div className="h-96">
              {isFiltered ? (
                <Bar data={getSectorData()} options={chartOptions} />
              ) : (
                <Doughnut data={getSectorData()} options={{ ...chartOptions, scales: undefined }} />
              )}
            </div>
          </div>
        )}

        {activeChart === 'performance' && (
          <div className="h-full">
            <h3 className="text-md font-medium mb-4">
              {isFiltered ? 'Company Performance Metrics' : 'IBEX 35 Performance Overview'}
            </h3>
            <div className="h-96">
              <Radar data={getPerformanceData()} options={radarOptions} />
            </div>
          </div>
        )}

        {activeChart === 'network' && (
          <div className="h-full">
            <h3 className="text-md font-medium mb-4 flex items-center gap-2">
              <Users className="w-4 h-4" />
              {isFiltered ? `${selectedCompany!.company} Network` : 'Director & Shareholder Network'}
            </h3>
            <NetworkGraph companies={displayData} selectedCompany={selectedCompany} />
          </div>
        )}
      </div>
    </div>
  );
}