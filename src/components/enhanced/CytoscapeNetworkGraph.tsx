import { useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import styled from 'styled-components';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2, Minimize2, Focus } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

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
`;

const GraphContainer = styled.div`
  width: 100%;
  height: 100%;
  min-height: 400px;
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

const Legend = styled.div`
  position: absolute;
  bottom: 16px;
  left: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  z-index: 10;
`;

const LegendTitle = styled.h4`
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  
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

export function CytoscapeNetworkGraph({ companies, selectedCompanyIds }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; visible: boolean }>({
    x: 0, y: 0, text: '', visible: false
  });

  useEffect(() => {
    if (!containerRef.current || !companies || companies.length === 0) return;

    // Filter relevant companies with null safety
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => c && c.ticker && selectedCompanyIds.has(c.ticker))
      : []; // Show nothing if no companies are selected

    if (relevantCompanies.length === 0) {
      // Clear the graph if no companies selected
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
      return;
    }

    // Prepare graph data
    const elements: ElementDefinition[] = [];
    let hasValidElements = false;

    // Calculate node sizes based on number of companies
    const numCompanies = relevantCompanies.length;
    const companySize = Math.max(30, Math.min(60, 200 / Math.sqrt(numCompanies)));
    const directorSize = Math.max(20, Math.min(40, 150 / Math.sqrt(numCompanies)));

    // Add company nodes
    relevantCompanies.forEach(company => {
      if (company && company.ticker) {
        elements.push({
          data: {
            id: company.ticker,
            label: company.formattedTicker || company.ticker,
            type: 'company',
            company: company,
            size: companySize,
            color: selectedCompanyIds.has(company.ticker) ? '#3b82f6' : '#6366f1'
          }
        });
        hasValidElements = true;
      }

      // Add director nodes (with null safety)
      if (company.directors && Array.isArray(company.directors) && company.directors.length > 0) {
        company.directors.forEach((director, idx) => {
          if (director && director.name) {
            const directorId = `dir_${company.ticker}_${idx}`;
            elements.push({
              data: {
                id: directorId,
                label: director.name.split(' ').slice(0, 2).join(' '),
                type: 'director',
                director: director,
                company: company,
                size: directorSize,
                color: '#8b5cf6'
              }
            });

            // Add edge between company and director
            elements.push({
              data: {
                id: `edge_${company.ticker}_${directorId}`,
                source: company.ticker,
                target: directorId,
                type: 'board_member'
              }
            });
          }
        });
      } else {
        // Add a placeholder director node if no directors exist
        const placeholderDirectorId = `dir_${company.ticker}_placeholder`;
        elements.push({
          data: {
            id: placeholderDirectorId,
            label: 'Board Info',
            type: 'director',
            director: { name: 'Board Information', position: 'Placeholder', appointmentDate: '', bioUrl: '' },
            company: company,
            size: directorSize * 0.8,
            color: '#9ca3af'
          }
        });

        // Add edge between company and placeholder director
        elements.push({
          data: {
            id: `edge_${company.ticker}_${placeholderDirectorId}`,
            source: company.ticker,
            target: placeholderDirectorId,
            type: 'board_member'
          }
        });
      }
    });

    // Only initialize if we have valid elements
    if (!hasValidElements || elements.length === 0) {
      console.warn('No valid elements for Cytoscape graph');
      return;
    }

    console.log(`🔍 Cytoscape initializing with ${elements.length} elements:`, elements.map(e => ({ id: e.data.id, type: e.data.type })));

    // Adjust layout parameters based on graph complexity
    const totalNodes = elements.filter(e => !e.data.source).length;
    const idealEdgeLength = Math.max(20, Math.min(50, 300 / Math.sqrt(totalNodes)));
    const nodeRepulsion = Math.max(1000, Math.min(4000, 8000 / Math.sqrt(totalNodes)));

    // Initialize Cytoscape with error handling
    let cy;
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
            'background-image': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTMgN1YxN0EyIDIgMCAwIDAgNSAxOUgxOUEyIDIgMCAwIDAgMjEgMTdWN00zIDdMMTIgMTNMMjEgN00zIDdMNSA1SDE5TDIxIDdaIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPgo8L3N2Zz4K',
            'background-fit': 'contain',
            'background-position-x': '50%',
            'background-position-y': '50%',
            'background-width': '60%',
            'background-height': '60%',
            'label': 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 8,
            'color': '#1f2937',
            'font-size': 12,
            'font-weight': 600,
            'font-family': 'Inter, sans-serif',
            'border-width': 3,
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
            'background-image': 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIwIDIxVjE5QTQgNCAwIDAgMCAxNiAxNUg4QTQgNCAwIDAgMCA0IDE5VjIxTTEyIDExQTQgNCAwIDEgMCAxMiAzQTQgNCAwIDAgMCAxMiAxMVoiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=',
            'background-fit': 'contain',
            'background-position-x': '50%',
            'background-position-y': '50%',
            'background-width': '60%',
            'background-height': '60%',
            'label': 'data(label)',
            'text-valign': 'bottom',
            'text-halign': 'center',
            'text-margin-y': 6,
            'color': '#1f2937',
            'font-size': 10,
            'font-weight': 500,
            'font-family': 'Inter, sans-serif',
            'border-width': 2,
            'border-color': '#ffffff',
            'border-opacity': 1,
            'z-index': 5
          }
        },
        {
          selector: 'edge',
          style: {
            'width': 2,
            'line-color': 'rgba(100, 116, 139, 0.4)',
            'target-arrow-color': 'rgba(100, 116, 139, 0.6)',
            'target-arrow-shape': 'triangle',
            'curve-style': 'straight',
            'z-index': 1
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
        animationDuration: 1500,
        fit: true,
        padding: 50,
        componentSpacing: 40,
        nodeOverlap: 4,
        idealEdgeLength: idealEdgeLength,
        edgeElasticity: 16,
        nestingFactor: 1.2,
        gravity: Math.min(1, 2 / Math.sqrt(totalNodes)),
        numIter: Math.min(1000, Math.max(500, totalNodes * 2)),
        initialTemp: 1000,
        coolingFactor: 0.99,
        minTemp: 1.0,
        nodeRepulsion: nodeRepulsion,
        randomize: false
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
    cy.on('mouseover', 'node', (event) => {
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
        tooltipText = `${companyName}\n${sector}\n${directorsCount} directors\nMarket Cap: €${(marketCap / 1e9).toFixed(1)}B`;
      } else if (data.director) {
        const director = data.director;
        const company = data.company;
        const companyName = company?.company || company?.name || 'Unknown Company';
        tooltipText = `${director.name || 'Unknown Director'}\n${director.position || 'Director'}\n${companyName}`;
        if (director.appointmentDate) {
          tooltipText += `\nSince: ${director.appointmentDate}`;
        }
      }
      
      setTooltip({
        x: position.x,
        y: position.y,
        text: tooltipText,
        visible: true
      });
    });

    cy.on('mouseout', 'node', (event) => {
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

    cy.on('tap', 'node', (event) => {
      const node = event.target;
      cy.elements().removeClass('highlighted');
      
      // Highlight connected nodes
      const connectedEdges = node.connectedEdges();
      const connectedNodes = connectedEdges.connectedNodes();
      
      node.addClass('highlighted');
      connectedNodes.addClass('highlighted');
      connectedEdges.addClass('highlighted');
    });

    cy.on('tap', (event) => {
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
  }, [companies, selectedCompanyIds]);

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
    setIsFullscreen(!isFullscreen);
    // Resize cytoscape after fullscreen toggle
    setTimeout(() => {
      if (cyRef.current) {
        cyRef.current.resize();
        cyRef.current.fit();
      }
    }, 300);
  };

  // Add keyboard support for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        setTimeout(() => {
          if (cyRef.current) {
            cyRef.current.resize();
            cyRef.current.fit();
          }
        }, 300);
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFullscreen]);

  return (
    <Container isFullscreen={isFullscreen}>
      <GraphContainer ref={containerRef} />
      
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
      
      <Legend>
        <LegendTitle>Network Legend</LegendTitle>
        <LegendItem>
          <LegendDot color="#3b82f6" size={16} />
          <span>Companies</span>
        </LegendItem>
        <LegendItem>
          <LegendDot color="#8b5cf6" size={12} />
          <span>Directors</span>
        </LegendItem>
        <LegendItem>
          <div style={{ 
            width: 16, 
            height: 2, 
            background: 'rgba(100, 116, 139, 0.4)', 
            position: 'relative' 
          }}>
            <div style={{
              position: 'absolute',
              right: -2,
              top: -3,
              width: 0,
              height: 0,
              borderLeft: '4px solid rgba(100, 116, 139, 0.6)',
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent'
            }} />
          </div>
          <span>Board Membership</span>
        </LegendItem>
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
    </Container>
  );
}