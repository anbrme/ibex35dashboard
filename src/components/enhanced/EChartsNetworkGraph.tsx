import { useEffect, useRef, useState, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import styled from 'styled-components';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2, Focus, Settings } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';
import { NodeDetailModal } from './NodeDetailModal';

// Duplicate the NodeData interface from NodeDetailModal to ensure consistency
interface NodeData {
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
    bioUrl?: string;
  };
  shareholder?: {
    name: string;
    type?: string;
    percentage?: number;
    shares?: number;
    reportDate?: string;
  };
  companies?: string[];
}

// ECharts specific interfaces
interface EChartsNode {
  id: string;
  name: string;
  category: number;
  symbolSize: number;
  value?: number;
  itemStyle?: {
    color: string;
  };
  label?: {
    show: boolean;
    position: string;
    fontSize: number;
  };
  companyData?: SecureIBEXCompanyData;
  directorData?: {
    name: string;
    companyCount: number;
    companies: string[];
    allPositions: string[];
    appointmentDate?: string;
    bioUrl?: string;
  };
  shareholderData?: {
    name: string;
    type?: string;
    totalPercentage: number;
    percentage?: number;
    shares?: number;
    companies: string[];
    reportDate?: string;
  };
}

interface EChartsLink {
  source: string;
  target: string;
  lineStyle?: {
    color: string;
    width: number;
    opacity: number;
  };
}

interface DirectorData {
  name: string;
  position?: string;
  appointmentDate?: string;
  bioUrl?: string;
}

interface ShareholderData {
  name: string;
  type?: string;
  percentage: number;
  shares?: number;
  reportDate?: string;
}
// import { networkAnalyticsService } from '../../services/networkAnalytics';

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
  height: 600px;
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

const LayoutPanel = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'visible'
})<{ visible: boolean }>`
  position: absolute;
  top: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  padding: 16px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  transform: ${props => props.visible ? 'translateX(0)' : 'translateX(-110%)'};
  opacity: ${props => props.visible ? 1 : 0};
  transition: all 0.3s ease;
  z-index: 20;
`;

const LayoutSelector = styled.select`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  background: white;
  font-size: 14px;
  margin-bottom: 12px;
`;

const FilterGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #374151;
`;

const SliderGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
`;

const Slider = styled.input`
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #e5e7eb;
  outline: none;
  -webkit-appearance: none;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3b82f6;
    cursor: pointer;
  }
`;

export function EChartsNetworkGraph({ companies, selectedCompanyIds }: Props) {
  console.log('EChartsNetworkGraph mounted with companies:', companies.length, 'selectedCompanyIds:', selectedCompanyIds.size);
  const chartRef = useRef<ReactECharts>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [layoutPanelVisible, setLayoutPanelVisible] = useState(false);
  const [currentLayout, setCurrentLayout] = useState('force');
  const [minDirectorCompanies, setMinDirectorCompanies] = useState(1);
  const [minShareholderPercentage, setMinShareholderPercentage] = useState(0);
  const [repulsion, setRepulsion] = useState(80);
  const [edgeLength, setEdgeLength] = useState(120);
  const [gravity, setGravity] = useState(0.1);
  const [friction, setFriction] = useState(0.6);
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    nodeData: NodeData | null;
  }>({
    isOpen: false,
    nodeData: null
  });

  // Transform company data to ECharts format
  const { chartData } = useMemo(() => {
    const relevantCompanies = companies.filter(company => 
      selectedCompanyIds.has(company.ticker)
    );

    if (relevantCompanies.length === 0) {
      return { 
        chartData: { nodes: [], links: [], categories: [] },
        networkAnalysis: null 
      };
    }

    // Create network analysis (for future use)
    // const analysis = networkAnalyticsService.calculateNetworkMetrics(relevantCompanies);

    // Create nodes and links for ECharts
    const nodes: EChartsNode[] = [];
    const links: EChartsLink[] = [];
    const categories = [
      { name: 'Company', itemStyle: { color: '#3b82f6' } },
      { name: 'Director', itemStyle: { color: '#7c3aed' } },
      { name: 'Shareholder', itemStyle: { color: '#059669' } }
    ];

    // Track consolidated entities
    const directorsMap = new Map<string, {
      director: DirectorData;
      companies: Set<string>;
      allPositions: string[];
    }>();
    const shareholdersMap = new Map<string, {
      shareholder: ShareholderData;
      companies: Set<string>;
      totalPercentage: number;
    }>();

    // Process companies and collect directors/shareholders
    relevantCompanies.forEach(company => {
      if (!company?.ticker) return;

      // Add company node
      nodes.push({
        id: company.ticker,
        name: company.formattedTicker || company.ticker,
        category: 0,
        symbolSize: Math.max(20, Math.min(50, (company.marketCapEur / 1e9) * 2)), // Size by market cap
        value: company.marketCapEur,
        itemStyle: {
          color: selectedCompanyIds.has(company.ticker) ? '#3b82f6' : '#6366f1'
        },
        label: {
          show: true,
          position: 'bottom',
          fontSize: Math.max(8, Math.min(12, (company.marketCapEur / 1e9) * 0.5 + 8))
        },
        companyData: company
      });

      // Process directors
      if (company.directors) {
        company.directors.forEach(director => {
          if (!director?.name) return;
          
          const directorKey = director.name.toLowerCase().trim();
          if (!directorsMap.has(directorKey)) {
            directorsMap.set(directorKey, {
              director,
              companies: new Set(),
              allPositions: []
            });
          }
          
          const directorData = directorsMap.get(directorKey)!;
          directorData.companies.add(company.ticker);
          if (director.position && !directorData.allPositions.includes(director.position)) {
            directorData.allPositions.push(director.position);
          }
        });
      }

      // Process shareholders
      if (company.shareholders) {
        company.shareholders.forEach(shareholder => {
          if (!shareholder?.name || !shareholder.percentage) return;
          
          const shareholderKey = shareholder.name.toLowerCase().trim();
          if (!shareholdersMap.has(shareholderKey)) {
            shareholdersMap.set(shareholderKey, {
              shareholder,
              companies: new Set(),
              totalPercentage: 0
            });
          }
          
          const shareholderData = shareholdersMap.get(shareholderKey)!;
          shareholderData.companies.add(company.ticker);
          shareholderData.totalPercentage += shareholder.percentage;
        });
      }
    });

    // Add director nodes and links
    directorsMap.forEach((directorData, directorKey) => {
      const companyCount = directorData.companies.size;
      if (companyCount < minDirectorCompanies) return;

      const directorId = `dir_${directorKey.replace(/[^a-z0-9]/g, '_')}`;
      const size = companyCount > 1 ? 25 : 20;
      
      nodes.push({
        id: directorId,
        name: directorData.director.name.split(' ').slice(0, 2).join(' '),
        category: 1,
        symbolSize: size,
        itemStyle: {
          color: companyCount > 1 ? '#7c3aed' : '#8b5cf6'
        },
        label: {
          show: true,
          position: 'bottom',
          fontSize: 10
        },
        directorData: {
          ...directorData.director,
          companyCount,
          companies: Array.from(directorData.companies),
          allPositions: directorData.allPositions,
          bioUrl: directorData.director.bioUrl
        }
      });

      // Add links to companies
      directorData.companies.forEach(companyTicker => {
        links.push({
          source: companyTicker,
          target: directorId,
          lineStyle: {
            color: '#7c3aed',
            width: 1,
            opacity: 0.6
          }
        });
      });
    });

    // Add shareholder nodes and links
    shareholdersMap.forEach((shareholderData, shareholderKey) => {
      if (shareholderData.totalPercentage < minShareholderPercentage) return;

      const shareholderId = `shr_${shareholderKey.replace(/[^a-z0-9]/g, '_')}`;
      const companyCount = shareholderData.companies.size;
      const size = Math.min(35, 15 + shareholderData.totalPercentage * 0.5);
      
      nodes.push({
        id: shareholderId,
        name: shareholderData.shareholder.name.length > 20 
          ? shareholderData.shareholder.name.substring(0, 17) + '...'
          : shareholderData.shareholder.name,
        category: 2,
        symbolSize: size,
        itemStyle: {
          color: companyCount > 1 ? '#059669' : '#10b981'
        },
        label: {
          show: true,
          position: 'bottom',
          fontSize: 9
        },
        shareholderData: {
          ...shareholderData.shareholder,
          totalPercentage: shareholderData.totalPercentage,
          companies: Array.from(shareholderData.companies)
        }
      });

      // Add links to companies
      shareholderData.companies.forEach(companyTicker => {
        links.push({
          source: companyTicker,
          target: shareholderId,
          lineStyle: {
            color: '#059669',
            width: Math.max(1, shareholderData.totalPercentage * 0.1),
            opacity: 0.7
          }
        });
      });
    });

    const result = { nodes, links, categories };
    console.log('Chart data generated:', {
      nodesCount: nodes.length,
      linksCount: links.length,
      categoriesCount: categories.length,
      firstNode: nodes[0]
    });
    
    return {
      chartData: result
    };
  }, [companies, selectedCompanyIds, minDirectorCompanies, minShareholderPercentage]);

  // ECharts option configuration
  const option = useMemo(() => {
    const config = {
    title: {
      text: `Corporate Network (${chartData.nodes.length} nodes)`,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: { data: EChartsNode }) => {
        const { data } = params;
        if (data.companyData) {
          return `
            <strong>${data.companyData.company}</strong><br/>
            Ticker: ${data.companyData.ticker}<br/>
            Market Cap: €${(data.companyData.marketCapEur / 1e9).toFixed(1)}B<br/>
            Sector: ${data.companyData.sector}
          `;
        } else if (data.directorData) {
          return `
            <strong>${data.directorData.name}</strong><br/>
            Position: ${data.directorData.allPositions.join(', ')}<br/>
            Companies: ${data.directorData.companyCount}<br/>
            Cross-board Director: ${data.directorData.companyCount > 1 ? 'Yes' : 'No'}
          `;
        } else if (data.shareholderData) {
          return `
            <strong>${data.shareholderData.name}</strong><br/>
            Type: ${data.shareholderData.type}<br/>
            Total Ownership: ${data.shareholderData.totalPercentage.toFixed(1)}%<br/>
            Companies: ${data.shareholderData.companies.length}
          `;
        }
        return data.name;
      }
    },
    legend: chartData.categories.length > 0 ? {
      data: chartData.categories.map(cat => cat.name),
      bottom: 10,
      left: 'center'
    } : undefined,
    series: [{
      type: 'graph',
      layout: currentLayout === 'force' ? 'force' : currentLayout,
      data: chartData.nodes,
      links: chartData.links,
      categories: chartData.categories,
      roam: true,
      focusNodeAdjacency: true,
      draggable: true,
      force: currentLayout === 'force' ? {
        repulsion: repulsion,
        gravity: gravity,
        edgeLength: edgeLength,
        layoutAnimation: true,
        friction: friction,
        initLayout: 'circular'
      } : undefined,
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 3
        }
      },
      lineStyle: {
        curveness: 0.1, // ECharts property name
        opacity: 0.8
      }
    }],
    animationDuration: 1500,
    animationEasingUpdate: 'quinticInOut'
    };
    
    // Validate data structure for ECharts graph
    const validationInfo = {
      hasTitle: !!config.title,
      hasTooltip: !!config.tooltip,
      hasLegend: !!config.legend,
      seriesCount: config.series?.length,
      seriesType: config.series?.[0]?.type,
      dataNodesCount: config.series?.[0]?.data?.length,
      dataLinksCount: config.series?.[0]?.links?.length,
      sampleNode: config.series?.[0]?.data?.[0],
      sampleLink: config.series?.[0]?.links?.[0],
      hasCategories: !!config.series?.[0]?.categories,
      layout: config.series?.[0]?.layout
    };
    
    console.log('ECharts option validation:', validationInfo);
    
    return config;
  }, [chartData, currentLayout, repulsion, gravity, edgeLength, friction]);

  const handleNodeClick = (params: { data: EChartsNode }) => {
    const { data } = params;
    console.log('Node clicked - full data:', data);
    console.log('Node data fields:', {
      id: data.id,
      name: data.name,
      companyData: data.companyData,
      directorData: data.directorData,
      shareholderData: data.shareholderData
    });
    
    if (data.companyData) {
      const modalNodeData = {
        id: data.id || 'unknown',
        type: 'company' as const,
        label: data.name || 'Unknown Company',
        company: data.companyData
      };
      console.log('Setting company modal data:', modalNodeData);
      setModalData({
        isOpen: true,
        nodeData: modalNodeData
      });
    } else if (data.directorData) {
      setModalData({
        isOpen: true,
        nodeData: {
          id: data.id,
          type: 'director',
          label: data.name,
          director: {
            name: data.directorData.name,
            position: data.directorData.allPositions?.join(', '),
            allPositions: data.directorData.allPositions,
            companyCount: data.directorData.companyCount,
            appointmentDate: data.directorData.appointmentDate,
            bioUrl: data.directorData.bioUrl
          },
          companies: data.directorData.companies
        }
      });
    } else if (data.shareholderData) {
      setModalData({
        isOpen: true,
        nodeData: {
          id: data.id,
          type: 'shareholder',
          label: data.name,
          shareholder: {
            name: data.shareholderData.name,
            type: data.shareholderData.type,
            percentage: data.shareholderData.totalPercentage || data.shareholderData.percentage,
            shares: data.shareholderData.shares,
            reportDate: data.shareholderData.reportDate
          },
          companies: data.shareholderData.companies
        }
      });
    }
  };

  const handleZoomIn = () => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance();
      chart.dispatchAction({ type: 'graphRoam', zoom: 1.2 });
    }
  };

  const handleZoomOut = () => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance();
      chart.dispatchAction({ type: 'graphRoam', zoom: 0.8 });
    }
  };

  const handleFit = () => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance();
      chart.dispatchAction({ type: 'restore' });
    }
  };

  const handleReset = () => {
    if (chartRef.current) {
      const chart = chartRef.current.getEchartsInstance();
      chart.dispatchAction({ type: 'restore' });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  console.log('Rendering EChartsNetworkGraph with chart data:', chartData);
  
  if (chartData.nodes.length === 0) {
    return (
      <Container isFullscreen={isFullscreen}>
        <GraphContainer>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#6b7280',
            fontSize: '16px'
          }}>
            No companies selected. Please select companies from the left panel to view the network.
          </div>
        </GraphContainer>
      </Container>
    );
  };

  return (
    <Container isFullscreen={isFullscreen}>
      <GraphContainer>
        <ReactECharts
          ref={chartRef}
          option={option}  // Back to real option
          style={{ width: '100%', height: '100%' }}
          onEvents={{
            click: handleNodeClick
          }}
          onChartReady={() => {
            console.log('ECharts ready!');
          }}
        />
        
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
          <ControlButton 
            onClick={() => setLayoutPanelVisible(!layoutPanelVisible)} 
            title="Layout Settings"
          >
            <Settings size={16} />
          </ControlButton>
          <ControlButton onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}>
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </ControlButton>
        </Controls>

        <LayoutPanel visible={layoutPanelVisible}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 'bold' }}>
            Layout & Physics
          </h4>
          
          <LayoutSelector
            value={currentLayout}
            onChange={(e) => setCurrentLayout(e.target.value)}
          >
            <option value="force">Force-Directed</option>
            <option value="circular">Circular</option>
            <option value="none">Fixed</option>
          </LayoutSelector>
          
          {currentLayout === 'force' && (
            <>
              <SliderGroup>
                <FilterLabel>
                  Repulsion: {repulsion}
                  <Slider
                    type="range"
                    min="20"
                    max="300"
                    value={repulsion}
                    onChange={(e) => setRepulsion(Number(e.target.value))}
                  />
                </FilterLabel>
              </SliderGroup>
              
              <SliderGroup>
                <FilterLabel>
                  Edge Length: {edgeLength}
                  <Slider
                    type="range"
                    min="30"
                    max="400"
                    value={edgeLength}
                    onChange={(e) => setEdgeLength(Number(e.target.value))}
                  />
                </FilterLabel>
              </SliderGroup>
              
              <SliderGroup>
                <FilterLabel>
                  Gravity: {gravity.toFixed(2)}
                  <Slider
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={gravity}
                    onChange={(e) => setGravity(Number(e.target.value))}
                  />
                </FilterLabel>
              </SliderGroup>
              
              <SliderGroup>
                <FilterLabel>
                  Friction: {friction.toFixed(2)}
                  <Slider
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={friction}
                    onChange={(e) => setFriction(Number(e.target.value))}
                  />
                </FilterLabel>
              </SliderGroup>
            </>
          )}
          
          <FilterGroup style={{ marginTop: '16px' }}>
            <h5 style={{ margin: '0 0 8px 0', fontSize: '12px', fontWeight: 'bold' }}>
              Filters
            </h5>
            
            <SliderGroup>
              <FilterLabel>
                Min Director Companies: {minDirectorCompanies}
                <Slider
                  type="range"
                  min="1"
                  max="5"
                  value={minDirectorCompanies}
                  onChange={(e) => setMinDirectorCompanies(Number(e.target.value))}
                />
              </FilterLabel>
            </SliderGroup>
            
            <SliderGroup>
              <FilterLabel>
                Min Shareholder %: {minShareholderPercentage}%
                <Slider
                  type="range"
                  min="0"
                  max="10"
                  step="0.5"
                  value={minShareholderPercentage}
                  onChange={(e) => setMinShareholderPercentage(Number(e.target.value))}
                />
              </FilterLabel>
            </SliderGroup>
          </FilterGroup>
        </LayoutPanel>
      </GraphContainer>

      {modalData.nodeData && (
        <NodeDetailModal
          isOpen={modalData.isOpen}
          nodeData={modalData.nodeData}
          onClose={() => setModalData({ isOpen: false, nodeData: null })}
        />
      )}
    </Container>
  );
}