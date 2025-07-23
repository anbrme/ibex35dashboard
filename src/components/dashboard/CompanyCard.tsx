import type { DatabaseCompany, CompanyPrice } from '../../types/database';

interface CompanyCardProps {
  company: DatabaseCompany;
  latestPrice?: CompanyPrice | null;
  onClick?: () => void;
}

export function CompanyCard({ company, latestPrice, onClick }: CompanyCardProps) {
  const changeColor = latestPrice?.changePercent 
    ? latestPrice.changePercent > 0 
      ? 'text-green-600' 
      : latestPrice.changePercent < 0 
      ? 'text-red-600' 
      : 'text-gray-600'
    : 'text-gray-600';

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-blue-500"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 truncate">{company.name}</h3>
          <p className="text-sm text-gray-500">{company.symbol}</p>
        </div>
        {latestPrice && (
          <div className="text-right">
            <p className="font-bold text-lg">€{latestPrice.price.toFixed(2)}</p>
            <p className={`text-sm ${changeColor}`}>
              {latestPrice.changePercent > 0 ? '+' : ''}{latestPrice.changePercent.toFixed(2)}%
            </p>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        {company.sector && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Sector:</span> {company.sector}
          </p>
        )}
        
        {company.marketCap && (
          <p className="text-sm text-gray-600">
            <span className="font-medium">Market Cap:</span> €{(company.marketCap / 1000000000).toFixed(1)}B
          </p>
        )}
        
        {latestPrice && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Volume: {latestPrice.volume.toLocaleString()}</span>
            <span className={changeColor}>
              {latestPrice.change > 0 ? '+' : ''}€{latestPrice.change.toFixed(2)}
            </span>
          </div>
        )}
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              IBEX 35
            </span>
            {company.employees && company.employees > 10000 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Large Corp
              </span>
            )}
          </div>
          <div className="text-xs text-gray-400">
            Click for details
          </div>
        </div>
      </div>
    </div>
  );
}