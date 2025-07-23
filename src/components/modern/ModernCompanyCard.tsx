import { motion } from 'framer-motion';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface ModernCompanyCardProps {
  company: SecureIBEXCompanyData;
  onClick?: () => void;
  index?: number;
  isSelected: boolean;
}

export function ModernCompanyCard({ company, onClick, index = 0, isSelected }: ModernCompanyCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={onClick}
      className={`group cursor-pointer w-full p-3 rounded-lg transition-colors duration-200 ${
        isSelected
          ? 'bg-blue-100 dark:bg-blue-800'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-grow truncate">
          <h3 className="font-semibold text-sm text-gray-800 dark:text-white truncate">
            {company.company}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {company.sector}
          </p>
        </div>
        <div className="text-right flex-shrink-0 pl-2">
            <p className="font-mono text-sm text-gray-800 dark:text-white">
              €{company.currentPriceEur.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {company.formattedTicker}
            </p>
        </div>
      </div>
    </motion.div>
  );
}