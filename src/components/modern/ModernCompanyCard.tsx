import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Building2, Users, Globe } from 'lucide-react';
import type { RealIBEXCompanyData } from '../../services/realGoogleSheetsService';

interface ModernCompanyCardProps {
  company: RealIBEXCompanyData;
  onClick?: () => void;
  index?: number;
}

export function ModernCompanyCard({ company, onClick, index = 0 }: ModernCompanyCardProps) {
  // Calculate change from mock previous day data (simplified for demo)
  const changePercent = (Math.random() - 0.5) * 6; // Random ±3%
  const change = (company.currentPriceEur * changePercent) / 100;
  
  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;
  
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  const trendColor = isPositive ? 'text-success-400' : isNegative ? 'text-danger-400' : 'text-gray-400';
  const trendBg = isPositive ? 'bg-success-400/10' : isNegative ? 'bg-danger-400/10' : 'bg-gray-400/10';

  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `€${(num / 1e3).toFixed(1)}K`;
    return `€${num.toFixed(2)}`;
  };

  const getSectorColor = (sector: string): string => {
    const colors: Record<string, string> = {
      'Financials': 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
      'Technology': 'from-purple-500/20 to-purple-600/20 border-purple-500/30',
      'Healthcare': 'from-green-500/20 to-green-600/20 border-green-500/30',
      'Energy': 'from-orange-500/20 to-orange-600/20 border-orange-500/30',
      'Utilities': 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30',
      'Industrials': 'from-gray-500/20 to-gray-600/20 border-gray-500/30',
      'Consumer Discretionary': 'from-pink-500/20 to-pink-600/20 border-pink-500/30',
      'Consumer Staples': 'from-emerald-500/20 to-emerald-600/20 border-emerald-500/30',
      'Materials': 'from-amber-500/20 to-amber-600/20 border-amber-500/30',
      'Real Estate': 'from-indigo-500/20 to-indigo-600/20 border-indigo-500/30',
      'Telecommunications': 'from-cyan-500/20 to-cyan-600/20 border-cyan-500/30',
    };
    return colors[sector] || 'from-primary-500/20 to-primary-600/20 border-primary-500/30';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className={`market-card relative overflow-hidden bg-gradient-to-br ${getSectorColor(company.sector)}`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-4 h-4 text-primary-400 flex-shrink-0" />
                <h3 className="font-display font-semibold text-white text-lg truncate group-hover:text-primary-300 transition-colors">
                  {company.company}
                </h3>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-300 font-mono">{company.formattedTicker}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400">{company.sector}</span>
              </div>
            </div>
            
            {/* Trend Indicator */}
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${trendBg}`}>
              <TrendIcon className={`w-3 h-3 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Price Section */}
          <div className="mb-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono">
                €{company.currentPriceEur.toFixed(3)}
              </span>
              <span className={`text-sm font-medium ${trendColor}`}>
                {isPositive ? '+' : ''}€{Math.abs(change).toFixed(3)}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="glass-card p-3 bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3 h-3 text-primary-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Market Cap</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {formatNumber(company.marketCapEur)}
              </span>
            </div>
            
            <div className="glass-card p-3 bg-white/5">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-3 h-3 text-primary-400" />
                <span className="text-xs text-gray-400 uppercase tracking-wider">Volume</span>
              </div>
              <span className="text-sm font-semibold text-white">
                {formatNumber(company.volumeEur)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-500/20 text-primary-300 border border-primary-500/30">
                IBEX 35
              </span>
            </div>
            
            <div className="text-xs text-gray-500 group-hover:text-primary-400 transition-colors">
              Click for details →
            </div>
          </div>
        </div>

        {/* Hover Glow Effect */}
        <motion.div
          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.1) 100%)',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)',
          }}
        />
      </div>
    </motion.div>
  );
}