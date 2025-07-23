import { useState, useEffect } from 'react';
import { PriceChart } from '../charts';
import { DataService } from '../../services/dataService';
import type { DatabaseCompany, CompanyPrice, CompanyShareholder, CompanyDirector, CompanyNews, LobbyingMeeting } from '../../types/database';

interface CompanyDetailsProps {
  company: DatabaseCompany;
  onClose: () => void;
}

interface CompanyOverview {
  company: DatabaseCompany;
  latestPrice?: CompanyPrice | null;
  shareholders: CompanyShareholder[];
  directors: CompanyDirector[];
  news: CompanyNews[];
  lobbying: LobbyingMeeting[];
}

export function CompanyDetails({ company, onClose }: CompanyDetailsProps) {
  const [overview, setOverview] = useState<CompanyOverview | null>(null);
  const [priceHistory, setPriceHistory] = useState<CompanyPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'shareholders' | 'directors' | 'news' | 'lobbying'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [overviewData, timeSeriesData] = await Promise.all([
          DataService.getCompanyOverview(company.symbol),
          DataService.getCompanyFinancialTimeSeries(company.symbol, 'daily')
        ]);
        
        if (overviewData) {
          setOverview(overviewData);
        }
        
        if (timeSeriesData) {
          setPriceHistory(timeSeriesData.priceData);
        }
      } catch (error) {
        console.error('Error fetching company details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [company.symbol]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading company details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!overview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <p className="text-red-600 mb-4">Failed to load company details</p>
            <button 
              onClick={onClose}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'financials', label: 'Financials' },
    { id: 'shareholders', label: 'Shareholders' },
    { id: 'directors', label: 'Directors' },
    { id: 'news', label: 'News' },
    { id: 'lobbying', label: 'Lobbying' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{company.name}</h2>
              <p className="text-blue-100">{company.symbol} • {company.sector}</p>
              {overview.latestPrice && (
                <div className="mt-2 flex items-center space-x-4">
                  <span className="text-3xl font-bold">€{overview.latestPrice.price.toFixed(2)}</span>
                  <span className={`text-lg ${overview.latestPrice.changePercent > 0 ? 'text-green-300' : 'text-red-300'}`}>
                    {overview.latestPrice.changePercent > 0 ? '+' : ''}{overview.latestPrice.changePercent.toFixed(2)}%
                  </span>
                </div>
              )}
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-gray-300 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {priceHistory.length > 0 && (
                <PriceChart data={priceHistory} companyName={company.name} />
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Company Information</h3>
                  <div className="space-y-2 text-sm">
                    {company.description && (
                      <p><span className="font-medium">Description:</span> {company.description}</p>
                    )}
                    {company.employees && (
                      <p><span className="font-medium">Employees:</span> {company.employees.toLocaleString()}</p>
                    )}
                    {company.founded && (
                      <p><span className="font-medium">Founded:</span> {company.founded}</p>
                    )}
                    {company.headquarters && (
                      <p><span className="font-medium">Headquarters:</span> {company.headquarters}</p>
                    )}
                    {company.ceo && (
                      <p><span className="font-medium">CEO:</span> {company.ceo}</p>
                    )}
                    {company.website && (
                      <p><span className="font-medium">Website:</span> 
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                          {company.website}
                        </a>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3">Market Data</h3>
                  <div className="space-y-2 text-sm">
                    {company.marketCap && (
                      <p><span className="font-medium">Market Cap:</span> €{(company.marketCap / 1000000000).toFixed(2)}B</p>
                    )}
                    {overview.latestPrice && (
                      <>
                        <p><span className="font-medium">Volume:</span> {overview.latestPrice.volume.toLocaleString()}</p>
                        <p><span className="font-medium">High:</span> €{overview.latestPrice.high.toFixed(2)}</p>
                        <p><span className="font-medium">Low:</span> €{overview.latestPrice.low.toFixed(2)}</p>
                        <p><span className="font-medium">Open:</span> €{overview.latestPrice.open.toFixed(2)}</p>
                        <p><span className="font-medium">Previous Close:</span> €{overview.latestPrice.previousClose.toFixed(2)}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Financial Data</h3>
              <p className="text-gray-600">Financial metrics and historical data will be displayed here.</p>
            </div>
          )}

          {activeTab === 'shareholders' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Major Shareholders</h3>
              {overview.shareholders.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Shareholder</th>
                        <th className="text-left py-2">Type</th>
                        <th className="text-right py-2">Percentage</th>
                        <th className="text-right py-2">Shares</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overview.shareholders.map((shareholder) => (
                        <tr key={shareholder.id} className="border-b">
                          <td className="py-2 font-medium">{shareholder.name}</td>
                          <td className="py-2 capitalize">{shareholder.type}</td>
                          <td className="py-2 text-right">{shareholder.percentage.toFixed(2)}%</td>
                          <td className="py-2 text-right">{shareholder.shares.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-600">No shareholder data available.</p>
              )}
            </div>
          )}

          {activeTab === 'directors' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Board of Directors</h3>
              {overview.directors.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overview.directors.map((director) => (
                    <div key={director.id} className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold">{director.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{director.position}</p>
                      <div className="text-xs text-gray-500 space-y-1">
                        {director.age && <p>Age: {director.age}</p>}
                        {director.tenure && <p>Tenure: {director.tenure} years</p>}
                        {director.appointmentDate && (
                          <p>Appointed: {director.appointmentDate.toLocaleDateString()}</p>
                        )}
                        <p>Executive: {director.isExecutive ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No director data available.</p>
              )}
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Recent News</h3>
              {overview.news.length > 0 ? (
                <div className="space-y-4">
                  {overview.news.map((article) => (
                    <div key={article.id} className="border-b pb-4">
                      <h4 className="font-semibold text-blue-600 hover:underline">
                        <a href={article.url} target="_blank" rel="noopener noreferrer">
                          {article.title}
                        </a>
                      </h4>
                      {article.summary && (
                        <p className="text-sm text-gray-600 mt-1">{article.summary}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span>{article.source}</span>
                        <span>{article.publishedAt.toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No recent news available.</p>
              )}
            </div>
          )}

          {activeTab === 'lobbying' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">EU Lobbying Activities</h3>
              {overview.lobbying.length > 0 ? (
                <div className="space-y-4">
                  {overview.lobbying.map((meeting) => (
                    <div key={meeting.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{meeting.organizationName}</h4>
                        <span className="text-sm text-gray-500">{meeting.meetingDate.toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{meeting.purpose}</p>
                      <div className="grid grid-cols-2 gap-4 text-xs text-gray-500">
                        <div>
                          <p><span className="font-medium">Institution:</span> {meeting.euInstitution}</p>
                          <p><span className="font-medium">Location:</span> {meeting.location}</p>
                          <p><span className="font-medium">Type:</span> {meeting.meetingType}</p>
                        </div>
                        <div>
                          {meeting.quarterlySpending && (
                            <p><span className="font-medium">Quarterly Spending:</span> €{meeting.quarterlySpending.toLocaleString()}</p>
                          )}
                          {meeting.registrationNumber && (
                            <p><span className="font-medium">Registration:</span> {meeting.registrationNumber}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No lobbying data available.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}