import { useEffect, useRef, useState, useMemo } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import styled from 'styled-components';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2, Focus, Settings, Filter } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';
import { NodeDetailModal } from './NodeDetailModal';
import { networkAnalyticsService } from '../../services/networkAnalytics';

interface Props {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
  width?: number;
  height?: number;
}

const Container = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isFullscreen'
})<{ isFullscreen: boolean }>`
  position: ${props => props.isFullscreen ? 'fixed' : 'relative'};
  top: ${props => props.isFullscreen ? '0' : 'auto'};
  left: ${props => props.isFullscreen ? '0' : 'auto'};
  width: ${props => props.isFullscreen ? '100vw' : '100%'};
  height: ${props => props.isFullscreen ? '100vh' : '100%'};
  z-index: ${props => props.isFullscreen ? '9999' : 'auto'};
  border-radius: ${props => props.isFullscreen ? '0' : '16px'};
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  box-shadow: ${props => props.isFullscreen 
    ? '0 0 50px rgba(0, 0, 0, 0.3)' 
    : 'inset 0 2px 8px rgba(0, 0, 0, 0.1)'};
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const GraphContainer = styled.div`
  width: 100%;
  flex: 1;
  min-height: 0;
  position: relative;
`;

const Controls = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 10;
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  
  &:hover {
    background: white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const Tooltip = styled.div.withConfig({
  shouldForwardProp: (prop) => !['x', 'y', 'visible'].includes(prop as string)
})<{ x: number; y: number; visible: boolean }>`
  position: absolute;
  left: ${props => props.x}px;
  top: ${props => props.y}px;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
  transform: translate(-50%, -100%);
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.2s ease;
  z-index: 20;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  max-width: 250px;
  line-height: 1.4;
  
  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: rgba(0, 0, 0, 0.9);
  }
`;

const Legend = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isFullscreen', 'isVisible'].includes(prop as string)
})<{ isFullscreen: boolean; isVisible: boolean }>`
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: ${props => props.isVisible ? '16px' : '12px'};
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 10;
  transition: all 0.3s ease;
  max-height: ${props => props.isVisible ? '400px' : '50px'};
  overflow: hidden;
  cursor: pointer;
`;


const LegendTitle = styled.h4.withConfig({
  shouldForwardProp: (prop) => prop !== 'isFullscreen'
})<{ isFullscreen: boolean }>`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
`;

const LegendItem = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isFullscreen'
})<{ isFullscreen: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #374151;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const LegendDot = styled.div<{ color: string; size?: number }>`
  width: ${props => props.size || 12}px;
  height: ${props => props.size || 12}px;
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  flex-shrink: 0;
`;


const LayoutPanel = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible'
})<{ isVisible: boolean }>`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 15;
  transform: ${props => props.isVisible ? 'translateX(0)' : 'translateX(-100%)'};  
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: all 0.3s ease;
  min-width: 180px;
`;

const LayoutToggle = styled.button`
  position: absolute;
  top: 80px;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 16;
  
  &:hover {
    background: white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
`;

const LayoutTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LayoutSelector = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
`;

const FilterPanel = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isVisible'
})<{ isVisible: boolean }>`
  position: absolute;
  top: 130px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  z-index: 15;
  transform: ${props => props.isVisible ? 'translateX(0)' : 'translateX(-100%)'};  
  opacity: ${props => props.isVisible ? 1 : 0};
  transition: all 0.3s ease;
  min-width: 200px;
`;

const FilterToggle = styled.button`
  position: absolute;
  top: 130px;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 16;
  
  &:hover {
    background: white;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-1px);
  }
`;

const FilterTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const FilterGroup = styled.div`
  margin-bottom: 16px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const FilterLabel = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #374151;
  margin-bottom: 6px;
`;

const FilterInput = styled.input`
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;

const SearchContainer = styled.div`
  position: relative;
`;

const SuggestionsList = styled.div<{ isVisible: boolean }>`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 120px;
  overflow-y: auto;
  z-index: 1000;
  display: ${props => props.isVisible ? 'block' : 'none'};
`;

const SuggestionItem = styled.div`
  padding: 8px 12px;
  cursor: pointer;
  font-size: 12px;
  border-bottom: 1px solid #f3f4f6;
  
  &:hover {
    background: #f8fafc;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

export function CytoscapeNetworkGraph({ companies, selectedCompanyIds }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutPanelVisible, setLayoutPanelVisible] = useState(false);
  const [legendVisible, setLegendVisible] = useState(true);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [currentLayout, setCurrentLayout] = useState('cose');
  const [minDirectorCompanies, setMinDirectorCompanies] = useState(1);
  const [minShareholderPercentage, setMinShareholderPercentage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; visible: boolean }>({
    x: 0, y: 0, text: '', visible: false
  });
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    nodeData: {
      id: string;
      type: 'company' | 'director' | 'shareholder';
      label: string;
      company?: SecureIBEXCompanyData;
      director?: {
        name: string;
        position?: string;
        allPositions?: string[];
        companyCount?: number;
        appointmentDate?: string;
      };
      shareholder?: {
        name: string;
        type?: string;
        percentage?: number;
        totalPercentage?: number;
        companyCount?: number;
        reportDate?: string;
      };
      companies?: string[];
      networkMetrics?: {
        centrality: number;
        betweennessCentrality: number;
        closeness: number;
        degree: number;
        influence: number;
        connections: number;
      };
    } | null;
  }>({
    isOpen: false,
    nodeData: null
  });

  // Calculate network analytics only when companies change
  const networkAnalysis = useMemo(() => {
    if (!companies || companies.length === 0) return null;
    console.log('🔄 Recalculating network analytics for', companies.length, 'companies');
    return networkAnalyticsService.calculateNetworkMetrics(companies);
  }, [companies]);

  // Create autocomplete suggestions from selected companies only for better performance
  const allNames = useMemo(() => {
    if (selectedCompanyIds.size === 0) return [];
    
    const names = new Set<string>();
    const relevantCompanies = companies.filter(c => c && c.ticker && selectedCompanyIds.has(c.ticker));
    
    // Add company names
    relevantCompanies.forEach(company => {
      if (company.company) names.add(company.company);
      if (company.ticker) names.add(company.ticker);
    });
    
    // Add director names
    relevantCompanies.forEach(company => {
      if (company.directors) {
        company.directors.forEach(director => {
          if (director.name) names.add(director.name);
        });
      }
    });
    
    // Add shareholder names
    relevantCompanies.forEach(company => {
      if (company.shareholders) {
        company.shareholders.forEach(shareholder => {
          if (shareholder.name) names.add(shareholder.name);
        });
      }
    });
    
    console.log('🔍 Generated', names.size, 'autocomplete names from', relevantCompanies.length, 'companies');
    return Array.from(names).sort();
  }, [companies, selectedCompanyIds]);

  // Handle search input and suggestions
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    
    if (value.length > 1) {
      const filtered = allNames.filter(name => 
        name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 8); // Limit to 8 suggestions
      
      setSearchSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
  };


  useEffect(() => {
    if (!containerRef.current || !companies || companies.length === 0) return;

    // Filter relevant companies with null safety
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => c && c.ticker && selectedCompanyIds.has(c.ticker))
      : []; // Show nothing if no companies are selected

    console.log('🎯 Graph update triggered:', {
      selectedCompanies: selectedCompanyIds.size,
      relevantCompanies: relevantCompanies.length,
      searchTerm,
      minDirectorCompanies,
      minShareholderPercentage
    });

    if (relevantCompanies.length === 0) {
      // Clear the graph if no companies selected
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      return;
    }

    // Prepare graph data with consolidated nodes
    const elements: ElementDefinition[] = [];
    let hasValidElements = false;

    // Calculate node sizes based on number of companies and network metrics
    const relevantCompaniesCount = relevantCompanies.length;
    const baseCompanySize = Math.max(30, Math.min(60, 200 / Math.sqrt(relevantCompaniesCount)));
    const baseDirectorSize = Math.max(20, Math.min(40, 150 / Math.sqrt(relevantCompaniesCount)));
    const baseShareholderSize = Math.max(15, Math.min(35, 120 / Math.sqrt(relevantCompaniesCount)));

    // Helper function to get enhanced node size based on metrics
    const getEnhancedNodeSize = (baseSize: number, nodeId: string): number => {
      if (!networkAnalysis) return baseSize;
      
      const metrics = networkAnalyticsService.getNodeMetrics(nodeId, networkAnalysis);
      if (!metrics) return baseSize;
      
      // Scale based on influence and centrality
      const influenceMultiplier = Math.max(1, Math.min(2, 1 + metrics.influence));
      const centralityMultiplier = Math.max(1, Math.min(1.5, 1 + metrics.centrality));
      
      return Math.round(baseSize * influenceMultiplier * centralityMultiplier);
    };

    // Helper function to get enhanced node color based on metrics
    const getEnhancedNodeColor = (baseColor: string, nodeId: string, type: string): string => {
      if (!networkAnalysis) return baseColor;
      
      const metrics = networkAnalyticsService.getNodeMetrics(nodeId, networkAnalysis);
      if (!metrics) return baseColor;
      
      // Enhanced colors for high-influence nodes
      if (type === 'company') {
        if (metrics.influence > 2) return '#1e40af'; // Darker blue for high influence companies
        if (metrics.centrality > 0.5) return '#2563eb'; // Medium blue for central companies
        return baseColor;
      } else if (type === 'director') {
        if (metrics.connections > 2) return '#581c87'; // Darker purple for cross-board directors
        if (metrics.influence > 3) return '#6b21a8'; // Enhanced purple for influential directors
        return baseColor;
      } else if (type === 'shareholder') {
        if (metrics.influence > 1) return '#047857'; // Darker green for major shareholders
        if (metrics.connections > 1) return '#059669'; // Enhanced green for cross-company shareholders
        return baseColor;
      }
      
      return baseColor;
    };

    // Collect and consolidate directors and shareholders
    const directorsMap = new Map<string, {
      director: {
        name: string;
        position?: string;
      };
      companies: Set<string>;
      allPositions: string[];
    }>();
    
    const shareholdersMap = new Map<string, {
      shareholder: {
        name: string;
        percentage?: number;
      };
      companies: Set<string>;
      totalPercentage: number;
    }>();

    // First pass: collect all directors and shareholders
    relevantCompanies.forEach(company => {
      if (!company || !company.ticker) return;

      // Collect directors
      if (company.directors && Array.isArray(company.directors)) {
        company.directors.forEach(director => {
          if (director && director.name) {
            const directorKey = director.name.toLowerCase().trim();
            if (!directorsMap.has(directorKey)) {
              directorsMap.set(directorKey, {
                director: director,
                companies: new Set([company.ticker]),
                allPositions: [director.position || 'Director']
              });
            } else {
              const existing = directorsMap.get(directorKey)!;
              existing.companies.add(company.ticker);
              if (director.position && !existing.allPositions.includes(director.position)) {
                existing.allPositions.push(director.position);
              }
            }
          }
        });
      }

      // Collect shareholders
      if (company.shareholders && Array.isArray(company.shareholders)) {
        company.shareholders.forEach(shareholder => {
          if (shareholder && shareholder.name) {
            const shareholderKey = shareholder.name.toLowerCase().trim();
            if (!shareholdersMap.has(shareholderKey)) {
              shareholdersMap.set(shareholderKey, {
                shareholder: shareholder,
                companies: new Set([company.ticker]),
                totalPercentage: shareholder.percentage || 0
              });
            } else {
              const existing = shareholdersMap.get(shareholderKey)!;
              existing.companies.add(company.ticker);
              existing.totalPercentage += (shareholder.percentage || 0);
            }
          }
        });
      }
    });

    // Add company nodes (with search filtering)
    relevantCompanies.forEach(company => {
      if (company && company.ticker) {
        // Filter by search term
        const companyName = company.company || '';
        const ticker = company.ticker || '';
        if (searchTerm && !companyName.toLowerCase().includes(searchTerm.toLowerCase()) && !ticker.toLowerCase().includes(searchTerm.toLowerCase())) {
          return; // Skip companies that don't match search
        }
        
        const baseColor = selectedCompanyIds.has(company.ticker) ? '#3b82f6' : '#6366f1';
        const enhancedSize = getEnhancedNodeSize(baseCompanySize, company.ticker);
        const enhancedColor = getEnhancedNodeColor(baseColor, company.ticker, 'company');
        
        elements.push({
          data: {
            id: company.ticker,
            label: company.formattedTicker || company.ticker,
            type: 'company',
            company: company,
            size: enhancedSize,
            color: enhancedColor,
            networkMetrics: networkAnalysis ? networkAnalyticsService.getNodeMetrics(company.ticker, networkAnalysis) : null
          }
        });
        hasValidElements = true;
      }
    });

    // Add consolidated director nodes (with smart filtering for complex networks)
    directorsMap.forEach((directorData, directorKey) => {
      const directorId = `dir_${directorKey.replace(/[^a-z0-9]/g, '_')}`;
      const director = directorData.director;
      const companyCount = directorData.companies.size;
      
      // Filter directors based on user settings
      if (companyCount < minDirectorCompanies) {
        return; // Skip directors below threshold
      }
      
      // Filter by search term
      if (searchTerm && !director.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return; // Skip directors that don't match search
      }
      
      // Base color and size
      const baseColor = companyCount > 1 ? '#7c3aed' : '#8b5cf6';
      const baseSize = companyCount > 1 
        ? Math.min(baseDirectorSize * 1.5, baseDirectorSize + 10)
        : baseDirectorSize;

      // Apply network analytics enhancements
      const enhancedSize = getEnhancedNodeSize(baseSize, directorId);
      const enhancedColor = getEnhancedNodeColor(baseColor, directorId, 'director');

      elements.push({
        data: {
          id: directorId,
          label: director.name.split(' ').slice(0, 2).join(' '),
          type: 'director',
          director: {
            ...director,
            allPositions: directorData.allPositions,
            companyCount: companyCount
          },
          companies: Array.from(directorData.companies),
          size: enhancedSize,
          color: enhancedColor,
          networkMetrics: networkAnalysis ? networkAnalyticsService.getNodeMetrics(directorId, networkAnalysis) : null
        }
      });

      // Add edges to all companies
      directorData.companies.forEach(companyTicker => {
        elements.push({
          data: {
            id: `edge_${companyTicker}_${directorId}`,
            source: companyTicker,
            target: directorId,
            type: 'board_member'
          }
        });
      });
    });

    // Add consolidated shareholder nodes (with smart filtering for complex networks)
    shareholdersMap.forEach((shareholderData, shareholderKey) => {
      const shareholderId = `shr_${shareholderKey.replace(/[^a-z0-9]/g, '_')}`;
      const shareholder = shareholderData.shareholder;
      const companyCount = shareholderData.companies.size;
      const totalPercentage = shareholderData.totalPercentage;
      
      // Filter shareholders based on user settings
      if (totalPercentage < minShareholderPercentage) {
        return; // Skip shareholders below threshold
      }
      
      // Filter by search term
      if (searchTerm && !shareholder.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return; // Skip shareholders that don't match search
      }
      
      // Base color and size
      const baseColor = companyCount > 1 ? '#059669' : '#10b981';
      const baseSize = companyCount > 1 
        ? Math.min(baseShareholderSize * 1.5, baseShareholderSize + 8)
        : baseShareholderSize;

      // Apply network analytics enhancements
      const enhancedSize = getEnhancedNodeSize(baseSize, shareholderId);
      const enhancedColor = getEnhancedNodeColor(baseColor, shareholderId, 'shareholder');

      elements.push({
        data: {
          id: shareholderId,
          label: shareholder.name.split(' ').slice(0, 2).join(' '),
          type: 'shareholder',
          shareholder: {
            ...shareholder,
            companyCount: companyCount,
            totalPercentage: shareholderData.totalPercentage
          },
          companies: Array.from(shareholderData.companies),
          size: enhancedSize,
          color: enhancedColor,
          networkMetrics: networkAnalysis ? networkAnalyticsService.getNodeMetrics(shareholderId, networkAnalysis) : null
        }
      });

      // Add edges to all companies
      shareholderData.companies.forEach(companyTicker => {
        elements.push({
          data: {
            id: `edge_${companyTicker}_${shareholderId}`,
            source: companyTicker,
            target: shareholderId,
            type: 'shareholder'
          }
        });
      });
    });

    // Only initialize if we have valid elements
    if (!hasValidElements || elements.length === 0) {
      console.warn('No valid elements for Cytoscape graph');
      return;
    }

    console.log(`🔍 Cytoscape initializing with ${elements.length} elements:`, elements.map(e => ({ id: e.data.id, type: e.data.type })));

    // Adjust layout parameters based on graph complexity and container size
    const totalNodes = elements.filter(e => !e.data.source).length;
    const containerArea = containerRef.current ? 
      containerRef.current.offsetWidth * containerRef.current.offsetHeight : 
      800 * 600;
    
    // Dynamic spacing based on available space and number of nodes
    const optimalSpacing = Math.sqrt(containerArea / totalNodes);
    const idealEdgeLength = Math.max(40, Math.min(120, optimalSpacing * 0.8));
    const nodeRepulsion = Math.max(2000, Math.min(8000, optimalSpacing * 30));
    const padding = isFullscreen ? 30 : 40;

    // Initialize Cytoscape with error handling
    let cy: Core;
    try {
      cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node[type="company"]',
          style: {
            'width': 'data(size)',
            'height': 'data(size)',
            'background-color': 'data(color)',
            'background-image': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgMjFoMThWOUgzdjEyem0yLTE4aDJWMWgydjJoOFYxaDJ2Mkg3djJ6IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMC41Ii8+CjxwYXRoIGQ9Ik01IDExaDJ2Mkg1di0yem0wIDRoMnYySDV2LTJ6bTQtNGgydjJIOXYtMnptMCA0aDJ2Mkg5di0yem00LTRoMnYyaC0ydi0yem0wIDRoMnYyaC0ydi0yem00LTRoMnYyaC0ydi0yem0wIDRoMnYyaC0ydi0yeiIgZmlsbD0iIzMzMzMzMyIvPgo8L3N2Zz4K',
            'background-fit': 'contain',
            'background-position-x': '50%',
            'background-position-y': '50%',
            'background-width': '70%',
            'background-height': '70%',
            'label': 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 10,
            'color': '#1f2937',
            'font-size': 13,
            'font-weight': 700,
            'font-family': 'Inter, sans-serif',
            'text-background-color': 'rgba(255, 255, 255, 0.9)',
            'text-background-padding': '3px',
            'text-background-shape': 'roundrectangle',
            'border-width': 4,
            'border-color': '#ffffff',
            'border-opacity': 1,
            'z-index': 10
          }
        },
        {
          selector: 'node[type="director"]',
          style: {
            'width': 'data(size)',
            'height': 'data(size)',
            'background-color': 'data(color)',
            'background-image': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSI0IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMC41Ii8+CjxwYXRoIGQ9Ik00IDIwYzAtNCAxLjc5LTcuNSA4LTcuNXM4IDMuNSA4IDcuNSIgZmlsbD0iIzMzMzMzMyIvPgo8cGF0aCBkPSJNNCAyMGMwLTQgMy41OC04IDgtOHM4IDQgOCA4IiBzdHJva2U9IiNmZmZmZmYiIHN0cm9rZS13aWR0aD0iMC41IiBmaWxsPSJub25lIi8+Cjwvc3ZnPgo=',
            'background-fit': 'contain',
            'background-position-x': '50%',
            'background-position-y': '50%',
            'background-width': '75%',
            'background-height': '75%',
            'label': 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'color': '#1f2937',
            'font-size': 11,
            'font-weight': 600,
            'font-family': 'Inter, sans-serif',
            'text-background-color': 'rgba(255, 255, 255, 0.8)',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'border-width': 3,
            'border-color': '#ffffff',
            'border-opacity': 1,
            'z-index': 5
          }
        },
        {
          selector: 'node[type="shareholder"]',
          style: {
            'width': 'data(size)',
            'height': 'data(size)',
            'background-color': 'data(color)',
            'background-image': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJsMS41IDYuNSA2LjUgMS01IDUgNSA1LTYuNSAxLjUtMS41IDYuNS0xLjUtNi41LTYuNS0xLjUgNS01LTUtNSA2LjUtMS41TDEyIDJ6IiBmaWxsPSIjZmZmZmZmIiBzdHJva2U9IiMzMzMzMzMiIHN0cm9rZS13aWR0aD0iMSIvPgo8Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIzIiBmaWxsPSIjMzMzMzMzIi8+Cjwvc3ZnPg==',
            'background-fit': 'contain',
            'background-position-x': '50%',
            'background-position-y': '50%',
            'background-width': '70%',
            'background-height': '70%',
            'label': 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 7,
            'color': '#1f2937',
            'font-size': 10,
            'font-weight': 600,
            'font-family': 'Inter, sans-serif',
            'text-background-color': 'rgba(255, 255, 255, 0.8)',
            'text-background-padding': '2px',
            'text-background-shape': 'roundrectangle',
            'shape': 'diamond',
            'border-width': 3,
            'border-color': '#ffffff',
            'border-opacity': 1,
            'z-index': 3
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': 'rgba(59, 130, 246, 0.6)',
            'target-arrow-color': 'rgba(59, 130, 246, 0.8)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'straight',
            'z-index': 1,
            'opacity': 0.8
          }
        },
        {
          selector: 'edge[type="board_member"]',
          style: {
            'line-color': 'rgba(139, 92, 246, 0.7)',
            'target-arrow-color': 'rgba(139, 92, 246, 0.9)',
            'line-style': 'solid'
          }
        },
        {
          selector: 'edge[type="shareholder"]',
          style: {
            'line-color': 'rgba(16, 185, 129, 0.7)',
            'target-arrow-color': 'rgba(16, 185, 129, 0.9)',
            'line-style': 'dashed'
          }
        },
        {
          selector: 'node:selected',
          style: {
            'border-width': 4,
            'border-color': '#f59e0b',
            'border-opacity': 1,
            'z-index': 999
          }
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'width': 3,
            'z-index': 999
          }
        },
        {
          selector: 'node.highlighted',
          style: {
            'border-width': 4,
            'border-color': '#10b981',
            'z-index': 998
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 3000,
        animationEasing: 'ease-in-out',
        fit: true,
        padding: padding,
        componentSpacing: Math.max(120, idealEdgeLength * 2.5),
        nodeOverlap: 20,
        idealEdgeLength: Math.max(80, idealEdgeLength * 1.5),
        edgeElasticity: 16,
        nestingFactor: 1.8,
        gravity: Math.max(0.1, Math.min(0.5, 0.8 / Math.sqrt(totalNodes))),
        numIter: Math.min(2000, Math.max(1200, totalNodes * 4)),
        initialTemp: 3000,
        coolingFactor: 0.92,
        minTemp: 0.5,
        nodeRepulsion: nodeRepulsion * 2,
        randomize: true,
        avoidOverlap: true,
        refresh: 10,
        ready: function() {
          console.log('Layout ready - applying final positioning...');
        },
        stop: function() {
          console.log('Layout stopped - nodes positioned');
        }
      },
      zoom: 1,
      pan: { x: 0, y: 0 },
      minZoom: 0.3,
      maxZoom: 3,
      zoomingEnabled: true,
      panningEnabled: true,
      boxSelectionEnabled: false,
      selectionType: 'single',
      autoungrabify: false,
      autounselectify: false
    });
    } catch (error) {
      console.error('Cytoscape initialization error:', error);
      return;
    }

    if (!cy) return;

    // Store reference
    cyRef.current = cy;

    // Wait for layout to complete before adjusting view
    cy.ready(() => {
      try {
        console.log('🎯 Cytoscape ready, adjusting view...');
        if (cy && !cy.destroyed()) {
          cy.fit();
          cy.center();
          console.log('✅ Cytoscape view adjusted successfully');
        }
      } catch (error) {
        console.warn('Cytoscape ready callback failed:', error);
      }
    });

    // Event handlers
    cy.on('mouseover', 'node', (event: any) => {
      const node = event.target;
      const data = node.data();
      const position = node.renderedPosition();
      
      // Add hover effect
      if (!node.hasClass('highlighted')) {
        node.style({
          'border-width': 3,
          'z-index': 998
        });
      }
      
      let tooltipText = '';
      console.log('🔍 Tooltip data:', data); // Debug log
      if (data.type === 'company') {
        const company = data.company;
        const directorsCount = company?.directors && Array.isArray(company.directors) ? company.directors.length : 0;
        const marketCap = company?.marketCapEur || 0;
        const companyName = company?.company || company?.name || data.label || 'Unknown Company';
        const sector = company?.sector || 'Unknown Sector';
        const metrics = data.networkMetrics;
        
        tooltipText = `${companyName}\n${sector}\n${directorsCount} directors\nMarket Cap: €${(marketCap / 1e9).toFixed(1)}B`;
        
        if (metrics) {
          tooltipText += `\nInfluence: ${metrics.influence.toFixed(2)}`;
          tooltipText += `\nCentrality: ${metrics.centrality.toFixed(2)}`;
          tooltipText += `\nConnections: ${metrics.connections}`;
        }
      } else if (data.director) {
        const director = data.director;
        const companies = data.companies || [];
        const companyCount = director.companyCount || 1;
        const metrics = data.networkMetrics;
        
        tooltipText = `${director.name || 'Unknown Director'}`;
        if (director.allPositions && director.allPositions.length > 0) {
          tooltipText += `\n${director.allPositions.join(', ')}`;
        }
        
        if (companyCount > 1) {
          tooltipText += `\nCross-board director (${companyCount} companies)`;
          tooltipText += `\nCompanies: ${companies.join(', ')}`;
        } else {
          tooltipText += `\nCompany: ${companies[0] || 'Unknown'}`;
        }
        
        if (director.appointmentDate) {
          tooltipText += `\nSince: ${director.appointmentDate}`;
        }
        
        if (metrics) {
          tooltipText += `\nInfluence: ${metrics.influence.toFixed(2)}`;
          tooltipText += `\nCentrality: ${metrics.centrality.toFixed(2)}`;
        }
      } else if (data.shareholder) {
        const shareholder = data.shareholder;
        const companies = data.companies || [];
        const companyCount = shareholder.companyCount || 1;
        const metrics = data.networkMetrics;
        
        tooltipText = `${shareholder.name || 'Unknown Shareholder'}`;
        tooltipText += `\nType: ${shareholder.type || 'Unknown'}`;
        
        if (companyCount > 1) {
          tooltipText += `\nCross-company shareholder (${companyCount} companies)`;
          tooltipText += `\nTotal ownership: ${shareholder.totalPercentage?.toFixed(1) || 0}%`;
          tooltipText += `\nCompanies: ${companies.join(', ')}`;
        } else {
          tooltipText += `\nOwnership: ${shareholder.percentage || 0}%`;
          tooltipText += `\nCompany: ${companies[0] || 'Unknown'}`;
        }
        
        if (shareholder.reportDate) {
          tooltipText += `\nReport Date: ${shareholder.reportDate}`;
        }
        
        if (metrics) {
          tooltipText += `\nInfluence: ${metrics.influence.toFixed(2)}`;
          tooltipText += `\nCentrality: ${metrics.centrality.toFixed(2)}`;
        }
      }
      
      setTooltip({
        x: position.x,
        y: position.y,
        text: tooltipText,
        visible: true
      });
    });

    cy.on('mouseout', 'node', (event: any) => {
      const node = event.target;
      
      // Remove hover effect unless highlighted
      if (!node.hasClass('highlighted')) {
        if (node.data('type') === 'company') {
          node.style({
            'border-width': 3,
            'z-index': 10
          });
        } else {
          node.style({
            'border-width': 2,
            'z-index': 5
          });
        }
      }
      
      setTooltip(prev => ({ ...prev, visible: false }));
    });

    cy.on('tap', 'node', (event: any) => {
      const node = event.target;
      cy.elements().removeClass('highlighted');
      
      // Highlight connected nodes
      const connectedEdges = node.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes();
      
      node.addClass('highlighted');
      connectedNodes.addClass('highlighted');
      connectedEdges.addClass('highlighted');

      // Open modal with node details
      const data = node.data();
      setModalData({
        isOpen: true,
        nodeData: {
          id: data.id,
          type: data.type,
          label: data.label,
          company: data.company,
          director: data.director,
          shareholder: data.shareholder,
          companies: data.companies,
          networkMetrics: data.networkMetrics
        }
      });
    });

    cy.on('tap', (event: any) => {
      if (event.target === cy) {
        cy.elements().removeClass('highlighted');
      }
    });

    // Cleanup
    return () => {
      try {
        if (cy && cy.destroy) {
          cy.destroy();
        }
      } catch (error) {
        console.error('Cytoscape cleanup error:', error);
      }
    };
  }, [companies, selectedCompanyIds, networkAnalysis, minDirectorCompanies, minShareholderPercentage, searchTerm, isFullscreen, currentLayout]);

  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 1.2);
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * 0.8);
    }
  };

  const handleReset = () => {
    if (cyRef.current) {
      cyRef.current.fit();
      cyRef.current.center();
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit();
    }
  };

  const toggleFullscreen = () => {
    const newFullscreenState = !isFullscreen;
    setIsFullscreen(newFullscreenState);
    
    // Manage body scroll
    if (newFullscreenState) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    // Longer delay to ensure DOM changes are complete
    setTimeout(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
        cyRef.current.fit();
        cyRef.current.center();
      }
    }, 400);
  };

  // Add keyboard support for fullscreen and cleanup body styles
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        document.body.style.overflow = 'auto';
        setTimeout(() => {
          if (cyRef.current && !cyRef.current.destroyed()) {
            cyRef.current.resize();
            cyRef.current.fit();
            cyRef.current.center();
          }
        }, 400);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
    
    // Cleanup body styles on component unmount
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen]);

  return (
    <Container isFullscreen={isFullscreen}>
      <GraphContainer ref={containerRef} />
      
      
      <LayoutToggle 
        onClick={() => setLayoutPanelVisible(!layoutPanelVisible)}
        title="Layout Settings"
      >
        <Settings size={16} />
      </LayoutToggle>
      
      <LayoutPanel isVisible={layoutPanelVisible}>
        <LayoutTitle>
          <Settings size={14} />
          Layout
        </LayoutTitle>
        
        <LayoutSelector 
          value={currentLayout}
          onChange={(e) => {
            setCurrentLayout(e.target.value);
            if (cyRef.current) {
              const layout = cyRef.current.layout({ name: e.target.value as any, fit: true, padding: 40 });
              layout.run();
            }
          }}
        >
          <option value="cose">Force-Directed</option>
          <option value="grid">Grid Layout</option>
          <option value="circle">Circular</option>
          <option value="breadthfirst">Hierarchical</option>
          <option value="concentric">Concentric</option>
        </LayoutSelector>
      </LayoutPanel>
      
      {!filtersVisible && (
        <FilterToggle 
          onClick={() => setFiltersVisible(true)}
          title="Network Filters"
        >
          <Filter size={16} />
        </FilterToggle>
      )}
      
      <FilterPanel isVisible={filtersVisible}>
        <FilterTitle>
          <Filter size={14} />
          Network Filters
        </FilterTitle>
        
        <FilterGroup>
          <FilterLabel>Search Names</FilterLabel>
          <SearchContainer>
            <FilterInput
              type="text"
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(searchSuggestions.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Company, director, or shareholder..."
            />
            <SuggestionsList isVisible={showSuggestions}>
              {searchSuggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={index}
                  onMouseDown={() => selectSuggestion(suggestion)}
                >
                  {suggestion}
                </SuggestionItem>
              ))}
            </SuggestionsList>
          </SearchContainer>
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Min. Director Companies</FilterLabel>
          <FilterInput
            type="number"
            min="1"
            max="10"
            value={minDirectorCompanies}
            onChange={(e) => setMinDirectorCompanies(parseInt(e.target.value) || 1)}
            placeholder="Min companies"
          />
        </FilterGroup>
        
        <FilterGroup>
          <FilterLabel>Min. Shareholder % ({minShareholderPercentage}%)</FilterLabel>
          <FilterInput
            type="range"
            min="0"
            max="50"
            step="1"
            value={minShareholderPercentage}
            onChange={(e) => setMinShareholderPercentage(parseInt(e.target.value))}
          />
        </FilterGroup>
        
        <button
          onClick={() => setFiltersVisible(false)}
          style={{
            width: '100%',
            padding: '8px',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
            marginTop: '8px'
          }}
        >
          Close Filters
        </button>
      </FilterPanel>
      
      <Controls>
        <ControlButton onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </ControlButton>
        <ControlButton onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </ControlButton>
        <ControlButton onClick={handleFit} title="Fit to Screen">
          <Focus size={16} />
        </ControlButton>
        <ControlButton onClick={handleReset} title="Reset View">
          <RotateCcw size={16} />
        </ControlButton>
        <ControlButton onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </ControlButton>
      </Controls>
      
      <Legend 
        isFullscreen={isFullscreen} 
        isVisible={legendVisible}
        onClick={() => setLegendVisible(!legendVisible)}
      >
        <LegendTitle isFullscreen={isFullscreen}>
          Network Legend {legendVisible ? '−' : '+'}
        </LegendTitle>
        {legendVisible && (
          <>
            <LegendItem isFullscreen={isFullscreen}>
              <LegendDot color="#3b82f6" size={16} />
              <span>Companies</span>
            </LegendItem>
            <LegendItem isFullscreen={isFullscreen}>
              <LegendDot color="#8b5cf6" size={12} />
              <span>Directors</span>
            </LegendItem>
            <LegendItem isFullscreen={isFullscreen}>
              <LegendDot color="#7c3aed" size={14} />
              <span>Cross-board Directors</span>
            </LegendItem>
            <LegendItem isFullscreen={isFullscreen}>
              <div style={{ 
                width: 10, 
                height: 10, 
                background: '#10b981', 
                transform: 'rotate(45deg)',
                borderRadius: '2px'
              }} />
              <span>Shareholders</span>
            </LegendItem>
            <LegendItem isFullscreen={isFullscreen}>
              <div style={{ 
                width: 12, 
                height: 12, 
                background: '#059669', 
                transform: 'rotate(45deg)',
                borderRadius: '2px'
              }} />
              <span>Major Shareholders</span>
            </LegendItem>
            <LegendItem isFullscreen={isFullscreen}>
              <div style={{ 
                width: 16, 
                height: 3, 
                background: 'rgba(139, 92, 246, 0.7)', 
                position: 'relative',
                borderRadius: '1px'
              }}>
                <div style={{
                  position: 'absolute',
                  right: -2,
                  top: -2,
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid rgba(139, 92, 246, 0.9)',
                  borderTop: '3px solid transparent',
                  borderBottom: '3px solid transparent'
                }} />
              </div>
              <span>Board Membership</span>
            </LegendItem>
            <LegendItem isFullscreen={isFullscreen}>
              <div style={{ 
                width: 16, 
                height: 3, 
                background: 'rgba(16, 185, 129, 0.7)', 
                position: 'relative',
                borderRadius: '1px',
                borderTop: '1px dashed rgba(16, 185, 129, 0.9)',
                borderBottom: '1px dashed rgba(16, 185, 129, 0.9)'
              }}>
                <div style={{
                  position: 'absolute',
                  right: -2,
                  top: -2,
                  width: 0,
                  height: 0,
                  borderLeft: '4px solid rgba(16, 185, 129, 0.9)',
                  borderTop: '3px solid transparent',
                  borderBottom: '3px solid transparent'
                }} />
              </div>
              <span>Ownership</span>
            </LegendItem>
          </>
        )}
      </Legend>
      
      <Tooltip
        x={tooltip.x}
        y={tooltip.y}
        visible={tooltip.visible}
      >
        {tooltip.text.split('\n').map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </Tooltip>

      <NodeDetailModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ isOpen: false, nodeData: null })}
        nodeData={modalData.nodeData}
      />
    </Container>
  );
}