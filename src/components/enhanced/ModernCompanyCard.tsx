import { Users, Zap, BarChart3 } from 'lucide-react';
import { SecureGoogleSheetsService, type SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface Props {
  company: SecureIBEXCompanyData;
  isSelected: boolean;
  onToggle: () => void;
}

const sectorIcons: Record<string, string> = {
  'Financial Services': '🏦',
  'Energy': '⚡',
  'Telecommunications': '📡',
  'Utilities': '🔧',
  'Infrastructure': '🏗️',
  'Tourism': '✈️',
  'Textile': '👕',
  'Steel': '⚙️',
  'Aviation': '🛩️',
  'Technology': '💻',
  'Industrial': '🏭',
  'Consumer': '🛒',
  'Real Estate': '🏢'
};

const sectorColors: Record<string, string> = {
  'Financial Services': 'from-blue-500 to-blue-600',
  'Energy': 'from-yellow-500 to-orange-500',
  'Telecommunications': 'from-purple-500 to-indigo-500',
  'Utilities': 'from-gray-500 to-slate-600',
  'Infrastructure': 'from-green-500 to-emerald-600',
  'Tourism': 'from-sky-500 to-cyan-500',
  'Textile': 'from-pink-500 to-rose-500',
  'Steel': 'from-gray-600 to-zinc-600',
  'Aviation': 'from-blue-600 to-indigo-600',
  'Technology': 'from-violet-500 to-purple-600',
  'Industrial': 'from-amber-500 to-orange-600',
  'Consumer': 'from-emerald-500 to-green-600',
  'Real Estate': 'from-stone-500 to-gray-600'
};

const getSectorIcon = (sector: string): string => {
  return sectorIcons[sector] || '🏢';
};

const getSectorColor = (sector: string): string => {
  return sectorColors[sector] || 'from-gray-500 to-slate-600';
};

const formatMarketCap = (marketCap: number): string => {
  if (marketCap >= 1e12) return `€${(marketCap / 1e12).toFixed(1)}T`;
  if (marketCap >= 1e9) return `€${(marketCap / 1e9).toFixed(1)}B`;
  if (marketCap >= 1e6) return `€${(marketCap / 1e6).toFixed(1)}M`;
  return `€${marketCap.toFixed(0)}`;
};

const formatVolume = (volume: number): string => {
  if (volume >= 1e9) return `€${(volume / 1e9).toFixed(1)}B`;
  if (volume >= 1e6) return `€${(volume / 1e6).toFixed(1)}M`;
  if (volume >= 1e3) return `€${(volume / 1e3).toFixed(1)}K`;
  return `€${volume.toFixed(0)}`;
};

export function ModernCompanyCard({ company, isSelected, onToggle }: Props) {
  return (
    <div
      onClick={onToggle}
      className={`group relative cursor-pointer transition-all duration-300 hover:scale-[1.02] ${
        isSelected 
          ? 'ring-2 ring-blue-500 ring-offset-2 shadow-xl' 
          : 'hover:shadow-lg'
      }`}
    >
      {/* Main Card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-xl overflow-hidden border border-white/20 shadow-lg">
        {/* Header with Sector */}
        <div className={`h-2 bg-gradient-to-r ${getSectorColor(company.sector)}`} />
        
        <div className="p-6">
          {/* Company Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${getSectorColor(company.sector)} shadow-lg`}>
                <span className="text-xl">{getSectorIcon(company.sector)}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {company.company}
                </h3>
                <p className="text-sm text-gray-600 font-medium">{company.sector}</p>
              </div>
            </div>
            
            {/* Selection Indicator */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
              isSelected 
                ? 'bg-blue-500 border-blue-500' 
                : 'border-gray-300 group-hover:border-blue-400'
            }`}>
              {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>
          </div>

          {/* Company Ticker */}
          <h4 className="text-lg font-semibold text-gray-800 mb-4 line-clamp-2">
            {company.formattedTicker || company.ticker}
          </h4>

          {/* Price Section */}
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg p-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {SecureGoogleSheetsService.safeCurrency(company.currentPriceEur)}
              </p>
              <p className="text-sm text-gray-600">Current Price</p>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-medium text-blue-800">Market Cap</span>
              </div>
              <p className="font-bold text-blue-900">{formatMarketCap(company.marketCapEur || 0)}</p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg p-3 border border-purple-100">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-xs font-medium text-purple-800">Volume</span>
              </div>
              <p className="font-bold text-purple-900">{formatVolume(company.volumeEur || 0)}</p>
            </div>
          </div>

          {/* Directors Section */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 border border-amber-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Board Members</span>
              </div>
              <span className="font-bold text-amber-900">{company.directors.length}</span>
            </div>
            
            {company.directors.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-amber-700">
                  Key: {company.directors.slice(0, 2).map(d => d.name.split(' ')[0]).join(', ')}
                  {company.directors.length > 2 && ` +${company.directors.length - 2} more`}
                </p>
              </div>
            )}
          </div>

          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none" />
        </div>
      </div>

      {/* Selected Glow Effect */}
      {isSelected && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-20 blur-xl -z-10 rounded-xl" />
      )}
    </div>
  );
}