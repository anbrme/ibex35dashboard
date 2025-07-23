import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface ModernCompanyCardProps {
  company: SecureIBEXCompanyData;
  onSelect: (company: SecureIBEXCompanyData) => void;
  isSelected: boolean;
}

const formatNumber = (num: number): string => {
  if (num >= 1e9) return `€${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `€${(num / 1e6).toFixed(1)}M`;
  return `€${num.toFixed(2)}`;
};

export function ModernCompanyCard({ company, onSelect, isSelected }: ModernCompanyCardProps) {
  return (
    <div
      className={`border-b border-border transition-colors ${isSelected ? 'bg-secondary' : ''}`}
    >
      <div 
        className="p-4 cursor-pointer hover:bg-muted/50"
        onClick={() => onSelect(company)}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-card-foreground">{company.company}</h3>
            <p className="text-sm text-muted-foreground">{company.sector}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold text-card-foreground">€{company.currentPriceEur.toFixed(2)}</p>
            <ChevronDown 
              className={`w-5 h-5 text-muted-foreground transition-transform ${isSelected ? 'transform rotate-180' : ''}`} 
            />
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-secondary/50">
              <h4 className="font-semibold mb-2 text-card-foreground">Financials</h4>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Market Cap</p>
                  <p className="font-medium text-card-foreground">{formatNumber(company.marketCapEur)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Volume</p>
                  <p className="font-medium text-card-foreground">{formatNumber(company.volumeEur)}</p>
                </div>
              </div>
              
              <h4 className="font-semibold mb-2 text-card-foreground">Directors</h4>
              <ul className="space-y-1 text-sm">
                {company.directors.map((director, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span className="text-card-foreground">{director.name}</span>
                    <span className="text-muted-foreground">{director.position}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}