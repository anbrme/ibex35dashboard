import { useState, useMemo } from 'react';
import { Users, Building2, UserCheck, Search, ChevronDown, ExternalLink } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface Props {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
}

interface DirectorWithCompany {
  name: string;
  position: string;
  appointmentDate: string;
  bioUrl: string;
  company: string;
  companyTicker: string;
  sector: string;
}

const positionIcons: Record<string, string> = {
  'president': '👑',
  'ceo': '🎯',
  'chairman': '👑',
  'director': '👤',
  'independent': '⚖️',
  'executive': '💼',
  'vice': '🎖️',
  'secretary': '📋',
  'consejero': '👤',
  'presidente': '👑',
  'delegado': '🎯',
  'independiente': '⚖️',
  'secretario': '📋',
  'coordinador': '🔗'
};

const getPositionIcon = (position: string): string => {
  const lowercasePosition = position.toLowerCase();
  for (const [key, icon] of Object.entries(positionIcons)) {
    if (lowercasePosition.includes(key)) {
      return icon;
    }
  }
  return '👤';
};

const getPositionColor = (position: string): string => {
  const lowercasePosition = position.toLowerCase();
  if (lowercasePosition.includes('president') || lowercasePosition.includes('chairman')) {
    return 'from-amber-500 to-orange-500';
  }
  if (lowercasePosition.includes('ceo') || lowercasePosition.includes('delegado')) {
    return 'from-red-500 to-pink-500';
  }
  if (lowercasePosition.includes('independent') || lowercasePosition.includes('independiente')) {
    return 'from-green-500 to-emerald-500';
  }
  if (lowercasePosition.includes('vice') || lowercasePosition.includes('coordinador')) {
    return 'from-blue-500 to-indigo-500';
  }
  return 'from-gray-500 to-slate-500';
};

export function EnhancedDirectorsPanel({ companies, selectedCompanyIds }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'company' | 'position'>('name');

  // Get all directors with company information
  const allDirectors = useMemo(() => {
    const directors: DirectorWithCompany[] = [];
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies;

    relevantCompanies.forEach(company => {
      company.directors.forEach(director => {
        directors.push({
          ...director,
          company: company.company,
          companyTicker: company.ticker,
          sector: company.sector
        });
      });
    });

    return directors;
  }, [companies, selectedCompanyIds]);

  // Get unique positions and sectors for filters
  const uniquePositions = useMemo(() => {
    const positions = new Set(allDirectors.map(d => d.position));
    return Array.from(positions).sort();
  }, [allDirectors]);

  const uniqueSectors = useMemo(() => {
    const sectors = new Set(allDirectors.map(d => d.sector));
    return Array.from(sectors).sort();
  }, [allDirectors]);

  // Filter and sort directors
  const filteredDirectors = useMemo(() => {
    let filtered = allDirectors.filter(director => {
      const matchesSearch = director.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           director.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           director.company.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPosition = selectedPosition === 'all' || director.position === selectedPosition;
      const matchesSector = selectedSector === 'all' || director.sector === selectedSector;

      return matchesSearch && matchesPosition && matchesSector;
    });

    // Sort directors
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'company':
          return a.company.localeCompare(b.company);
        case 'position':
          return a.position.localeCompare(b.position);
        default:
          return 0;
      }
    });

    return filtered;
  }, [allDirectors, searchQuery, selectedPosition, selectedSector, sortBy]);

  // Group directors by company
  const directorsByCompany = useMemo(() => {
    const grouped = new Map<string, DirectorWithCompany[]>();
    filteredDirectors.forEach(director => {
      const key = director.company;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(director);
    });
    return grouped;
  }, [filteredDirectors]);

  // Statistics
  const stats = useMemo(() => {
    const totalDirectors = filteredDirectors.length;
    const totalCompanies = new Set(filteredDirectors.map(d => d.company)).size;
    const avgDirectorsPerCompany = totalCompanies > 0 ? totalDirectors / totalCompanies : 0;
    
    return {
      totalDirectors,
      totalCompanies,
      avgDirectorsPerCompany
    };
  }, [filteredDirectors]);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Director Analysis</h2>
            <p className="text-sm text-gray-600">Complete board member directory</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Directors</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalDirectors}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-800">Companies</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.totalCompanies}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Avg/Company</span>
            </div>
            <p className="text-2xl font-bold text-amber-900">{stats.avgDirectorsPerCompany.toFixed(1)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search directors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm"
            />
          </div>

          {/* Position Filter */}
          <div className="relative">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm appearance-none"
            >
              <option value="all">All Positions</option>
              {uniquePositions.map(position => (
                <option key={position} value={position}>{position}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sector Filter */}
          <div className="relative">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm appearance-none"
            >
              <option value="all">All Sectors</option>
              {uniqueSectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'name' | 'company' | 'position')}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white/70 backdrop-blur-sm appearance-none"
            >
              <option value="name">Sort by Name</option>
              <option value="company">Sort by Company</option>
              <option value="position">Sort by Position</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Directors List */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {Array.from(directorsByCompany.entries()).map(([companyName, directors]) => (
          <div key={companyName} className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 overflow-hidden">
            {/* Company Header */}
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{companyName}</h3>
                  <p className="text-sm text-gray-600">
                    {directors[0].sector} • {directors.length} directors
                  </p>
                </div>
              </div>
            </div>

            {/* Directors Grid */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {directors.map((director, index) => (
                  <div key={`${director.name}-${index}`} className="group relative">
                    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
                      {/* Position Badge */}
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getPositionColor(director.position)} mb-3`}>
                        <span>{getPositionIcon(director.position)}</span>
                        <span>{director.position}</span>
                      </div>

                      {/* Director Info */}
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {director.name}
                        </h4>
                        
                        {director.appointmentDate && (
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Since:</span> {director.appointmentDate}
                          </p>
                        )}

                        {director.bioUrl && (
                          <a
                            href={director.bioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Biography</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filteredDirectors.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No directors found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}