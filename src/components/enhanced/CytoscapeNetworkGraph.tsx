import { useEffect, useRef, useState } from 'react';
import cytoscape, { type Core, type ElementDefinition } from 'cytoscape';
import styled from 'styled-components';
import { RotateCcw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface Props {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
  width?: number;
  height?: number;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.1);
`;

const GraphContainer = styled.div`
  width: 100%;
  height: 100%;
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

const Tooltip = styled.div<{ x: number; y: number; visible: boolean }>`
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
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; visible: boolean }>({
    x: 0, y: 0, text: '', visible: false
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Filter relevant companies
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies.slice(0, 8); // Show top 8 if none selected

    if (relevantCompanies.length === 0) return;

    // Prepare graph data
    const elements: ElementDefinition[] = [];

    // Add company nodes
    relevantCompanies.forEach(company => {
      elements.push({
        data: {
          id: company.ticker,
          label: company.formattedTicker || company.ticker,
          type: 'company',
          company: company,
          size: 60,
          color: selectedCompanyIds.has(company.ticker) ? '#3b82f6' : '#6366f1'
        }
      });

      // Add director nodes (with null safety)
      if (company.directors && Array.isArray(company.directors)) {
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
                size: 40,
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
      }
    });

    // Initialize Cytoscape
    const cy = cytoscape({
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
          selector: 'node:hover',
          style: {
            'border-width': 3,
            'z-index': 998
          }
        }
      ],
      layout: {
        name: 'cose',
        animate: true,
        animationDuration: 1000,
        animationEasing: 'ease-out',
        nodeRepulsion: function( _node: any ){ return 8000; },
        nodeOverlap: 20,
        idealEdgeLength: function( _edge: any ){ return 100; },
        edgeElasticity: function( _edge: any ){ return 400; },
        nestingFactor: 1.2,
        gravity: 0.1,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0,
        randomize: false,
        componentSpacing: 100,
        boundingBox: undefined,
        transform: function (_node: any, position: any) { return position; },
        ready: undefined,
        stop: undefined
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

    // Store reference
    cyRef.current = cy;

    // Event handlers
    cy.on('mouseover', 'node', (event) => {
      const node = event.target;
      const data = node.data();
      const position = node.renderedPosition();
      
      let tooltipText = '';
      if (data.type === 'company') {
        const directorsCount = data.company.directors && Array.isArray(data.company.directors) ? data.company.directors.length : 0;
        const marketCap = data.company.marketCapEur || 0;
        tooltipText = `${data.company.company || 'Unknown Company'}\n${data.company.sector || 'Unknown Sector'}\n${directorsCount} directors\nMarket Cap: €${(marketCap / 1e9).toFixed(1)}B`;
      } else if (data.director) {
        tooltipText = `${data.director.name || 'Unknown Director'}\n${data.director.position || 'Director'}\n${data.company.company || 'Unknown Company'}`;
        if (data.director.appointmentDate) {
          tooltipText += `\nSince: ${data.director.appointmentDate}`;
        }
      }
      
      setTooltip({
        x: position.x,
        y: position.y,
        text: tooltipText,
        visible: true
      });
    });

    cy.on('mouseout', 'node', () => {
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
      cy.destroy();
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

  return (
    <Container>
      <GraphContainer ref={containerRef} />
      
      <Controls>
        <ControlButton onClick={handleZoomIn} title="Zoom In">
          <ZoomIn size={16} />
        </ControlButton>
        <ControlButton onClick={handleZoomOut} title="Zoom Out">
          <ZoomOut size={16} />
        </ControlButton>
        <ControlButton onClick={handleFit} title="Fit to Screen">
          <Maximize2 size={16} />
        </ControlButton>
        <ControlButton onClick={handleReset} title="Reset View">
          <RotateCcw size={16} />
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