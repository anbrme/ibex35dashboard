import { motion } from 'framer-motion';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface ModernCompanyCardProps {
  company: SecureIBEXCompanyData;
  onClick?: () => void;
  index?: number;
}

export function ModernCompanyCard({ company, onClick, index = 0 }: ModernCompanyCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
    if (num >= 1e3) return `€${(num / 1e3).toFixed(1)}K`;
    return `€${num.toFixed(2)}`;
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
      className="group cursor-pointer w-full"
    >
      <div className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">
              {company.company}
            </h3>
            <span className="text-sm font-mono text-gray-500 dark:text-gray-400">{company.formattedTicker}</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{company.sector}</p>
          
          <div className="flex justify-between items-center mb-4">
            <div className="text-2xl font-bold text-gray-800 dark:text-white">
              €{company.currentPriceEur.toFixed(2)}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Market Cap</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{formatNumber(company.marketCapEur)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Volume</p>
              <p className="font-semibold text-gray-700 dark:text-gray-200">{formatNumber(company.volumeEur)}</p>
            </div>
          </div>

          {company.directors.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Directors</h4>
              <ul className="space-y-1">
                {company.directors.map((director, idx) => (
                  <li key={idx} className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {director.name} ({director.position})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}