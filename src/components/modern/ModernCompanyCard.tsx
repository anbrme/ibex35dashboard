import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, Building2, Users, Globe } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface ModernCompanyCardProps {
  company: SecureIBEXCompanyData;
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
      'Financial Services': 'from-blue-400/15 to-blue-500/15 border-blue-400/25',
      'Technology': 'from-purple-400/15 to-purple-500/15 border-purple-400/25',
      'Healthcare': 'from-green-400/15 to-green-500/15 border-green-400/25',
      'Energy': 'from-orange-400/15 to-orange-500/15 border-orange-400/25',
      'Utilities': 'from-yellow-400/15 to-yellow-500/15 border-yellow-400/25',
      'Construction': 'from-gray-400/15 to-gray-500/15 border-gray-400/25',
      'Infrastructure': 'from-slate-400/15 to-slate-500/15 border-slate-400/25',
      'Consumer Discretionary': 'from-pink-400/15 to-pink-500/15 border-pink-400/25',
      'Consumer Staples': 'from-emerald-400/15 to-emerald-500/15 border-emerald-400/25',
      'Materials': 'from-amber-400/15 to-amber-500/15 border-amber-400/25',
      'Real Estate': 'from-indigo-400/15 to-indigo-500/15 border-indigo-400/25',
      'Telecommunications': 'from-cyan-400/15 to-cyan-500/15 border-cyan-400/25',
      'Steel': 'from-zinc-400/15 to-zinc-500/15 border-zinc-400/25',
      'Tourism': 'from-teal-400/15 to-teal-500/15 border-teal-400/25',
      'Aviation': 'from-sky-400/15 to-sky-500/15 border-sky-400/25',
      'Information Technology': 'from-violet-400/15 to-violet-500/15 border-violet-400/25',
      'Textile': 'from-rose-400/15 to-rose-500/15 border-rose-400/25',
      'Logistics': 'from-lime-400/15 to-lime-500/15 border-lime-400/25',
      'Insurance': 'from-blue-400/15 to-blue-500/15 border-blue-400/25',
      'Manufacturing': 'from-neutral-400/15 to-neutral-500/15 border-neutral-400/25',
      'Pharmaceuticals': 'from-green-400/15 to-green-500/15 border-green-400/25',
      'Oil and Gas': 'from-orange-400/15 to-orange-500/15 border-orange-400/25',
      'Solar Energy': 'from-yellow-400/15 to-yellow-500/15 border-yellow-400/25',
      'Clothes and Cosmetics': 'from-pink-400/15 to-pink-500/15 border-pink-400/25',
    };
    return colors[sector] || 'from-primary-400/15 to-primary-500/15 border-primary-400/25';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ 
        scale: 1.01,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className="group cursor-pointer"
    >
      <div className={`relative overflow-hidden bg-gradient-to-br ${getSectorColor(company.sector)} rounded-xl border border-white/10 backdrop-blur-sm w-full max-w-sm mx-auto`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        
        {/* Main Content */}
        <div className="relative z-10 p-4">
          {/* Compact Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="w-3 h-3 text-primary-400 flex-shrink-0" />
                <h3 className="font-display font-semibold text-white text-sm truncate group-hover:text-primary-300 transition-colors">
                  {company.company}
                </h3>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-300 font-mono">{company.formattedTicker}</span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-400 truncate">{company.sector}</span>
              </div>
            </div>
            
            {/* Compact Trend */}
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full ${trendBg}`}>
              <TrendIcon className={`w-2.5 h-2.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {isPositive ? '+' : ''}{changePercent.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Compact Price */}
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-white font-mono">
                €{company.currentPriceEur.toFixed(2)}
              </span>
              <span className={`text-xs font-medium ${trendColor}`}>
                {isPositive ? '+' : ''}€{Math.abs(change).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Horizontal Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Globe className="w-3 h-3 text-primary-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Market Cap</div>
                <div className="text-xs font-semibold text-white">{formatNumber(company.marketCapEur)}</div>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <Users className="w-3 h-3 text-primary-400 flex-shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Volume</div>
                <div className="text-xs font-semibold text-white">{formatNumber(company.volumeEur)}</div>
              </div>
            </div>
          </div>

          {/* Analysis Sections Preview */}
          <div className="border-t border-white/10 pt-3">
            <div className="grid grid-cols-4 gap-1 mb-2">
              <div className="text-center">
                <div className={`w-2 h-2 rounded-full mx-auto mb-1 ${
                  company.directors.length > 0 ? 'bg-blue-400' : 'bg-blue-400/20'
                }`}></div>
                <div className="text-xs text-gray-500">
                  {company.directors.length > 0 ? `${company.directors.length}` : 'Directors'}
                </div>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-green-400/20 rounded-full mx-auto mb-1"></div>
                <div className="text-xs text-gray-500">Shares</div>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-purple-400/20 rounded-full mx-auto mb-1"></div>
                <div className="text-xs text-gray-500">Lobby</div>
              </div>
              <div className="text-center">
                <div className="w-2 h-2 bg-orange-400/20 rounded-full mx-auto mb-1"></div>
                <div className="text-xs text-gray-500">News</div>
              </div>
            </div>
            
            {/* Directors Preview - Move above grid */}
            {company.directors.length > 0 && (
              <div className="mb-3 p-2 bg-blue-500/10 rounded border border-blue-500/20">
                <div className="text-xs text-blue-300 mb-2 font-medium">👥 Directors ({company.directors.length}):</div>
                <div className="space-y-1">
                  {company.directors.slice(0, 2).map((director, idx) => (
                    <div key={idx} className="text-xs">
                      <div className="text-gray-200 font-medium truncate">{director.name}</div>
                      <div className="text-gray-400 text-xs">{director.position}</div>
                    </div>
                  ))}
                  {company.directors.length > 2 && (
                    <div className="text-xs text-blue-400">+{company.directors.length - 2} more directors</div>
                  )}
                </div>
              </div>
            )}
            
            <div className="text-xs text-center text-gray-500 group-hover:text-primary-400 transition-colors">
              Click for comprehensive analysis →
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