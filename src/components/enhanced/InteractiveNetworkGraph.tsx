import { useRef, useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface Props {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
  width?: number;
  height?: number;
}

interface Node {
  id: string;
  x: number;
  y: number;
  label: string;
  type: 'company' | 'director';
  radius: number;
  color: string;
  company?: SecureIBEXCompanyData;
  director?: any;
  isDragging?: boolean;
  targetX?: number;
  targetY?: number;
  vx?: number;
  vy?: number;
}

interface Edge {
  from: string;
  to: string;
  type: string;
}

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
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
  z-index: 10;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  
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

const Controls = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ControlButton = styled.button`
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: white;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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

const LegendDot = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.color};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
`;

export function InteractiveNetworkGraph({ companies, selectedCompanyIds, width = 800, height = 600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string; visible: boolean }>({
    x: 0, y: 0, text: '', visible: false
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<Node | null>(null);
  const [, setMousePos] = useState({ x: 0, y: 0 });

  // Initialize nodes and edges
  useEffect(() => {
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies.slice(0, 6); // Show top 6 if none selected

    if (relevantCompanies.length === 0) return;

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Create company nodes in a circle
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Dynamic radius calculation based on number of companies
    const baseRadius = Math.min(width, height) / 6;
    const companyRadius = relevantCompanies.length === 1 ? 0 : baseRadius + (relevantCompanies.length - 1) * 20;

    relevantCompanies.forEach((company, i) => {
      let companyX, companyY;
      
      if (relevantCompanies.length === 1) {
        // Single company: center it
        companyX = centerX;
        companyY = centerY;
      } else {
        // Multiple companies: arrange in circle
        const angle = (i * 2 * Math.PI) / relevantCompanies.length;
        companyX = centerX + Math.cos(angle) * companyRadius;
        companyY = centerY + Math.sin(angle) * companyRadius;
      }
      
      const companyNode: Node = {
        id: company.ticker,
        x: companyX,
        y: companyY,
        label: company.formattedTicker || company.ticker,
        type: 'company',
        radius: 40,
        color: selectedCompanyIds.has(company.ticker) ? '#3b82f6' : '#6366f1',
        company: company,
        vx: 0,
        vy: 0
      };
      newNodes.push(companyNode);

      // Create director nodes around each company
      const directorCount = company.directors.length;
      const directorRadius = relevantCompanies.length === 1 ? 120 : 100;
      
      company.directors.forEach((director, dirIndex) => {
        const directorId = `dir_${company.ticker}_${dirIndex}`;
        
        let directorX, directorY;
        
        if (relevantCompanies.length === 1) {
          // Single company: arrange directors in full circle around company
          const directorAngle = (dirIndex * 2 * Math.PI) / directorCount;
          directorX = companyX + Math.cos(directorAngle) * directorRadius;
          directorY = companyY + Math.sin(directorAngle) * directorRadius;
        } else {
          // Multiple companies: arrange directors in arc around each company
          const baseAngle = (i * 2 * Math.PI) / relevantCompanies.length;
          const arcSpread = Math.PI / 3; // 60 degree arc
          const directorAngle = baseAngle + (dirIndex - (directorCount - 1) / 2) * (arcSpread / Math.max(1, directorCount - 1));
          directorX = companyX + Math.cos(directorAngle) * directorRadius;
          directorY = companyY + Math.sin(directorAngle) * directorRadius;
        }
        
        const directorNode: Node = {
          id: directorId,
          x: directorX,
          y: directorY,
          label: director.name.split(' ').slice(0, 2).join(' '),
          type: 'director',
          radius: 22,
          color: '#8b5cf6',
          director: director,
          company: company,
          vx: 0,
          vy: 0
        };
        newNodes.push(directorNode);

        // Create edge between company and director
        newEdges.push({
          from: company.ticker,
          to: directorId,
          type: 'board_member'
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [companies, selectedCompanyIds, width, height]);

  // Physics simulation
  const simulate = useCallback(() => {
    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      
      // Apply forces
      newNodes.forEach(node => {
        if (node.isDragging) return;
        
        // Gravity towards center
        const centerX = width / 2;
        const centerY = height / 2;
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const force = 0.001;
          node.vx = (node.vx || 0) + (dx / distance) * force;
          node.vy = (node.vy || 0) + (dy / distance) * force;
        }
        
        // Repulsion between nodes
        newNodes.forEach(otherNode => {
          if (node === otherNode) return;
          
          const dx = otherNode.x - node.x;
          const dy = otherNode.y - node.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance > 0 && distance < 100) {
            const force = 0.5 / (distance * distance);
            node.vx = (node.vx || 0) - (dx / distance) * force;
            node.vy = (node.vy || 0) - (dy / distance) * force;
          }
        });
        
        // Apply damping
        node.vx = (node.vx || 0) * 0.98;
        node.vy = (node.vy || 0) * 0.98;
        
        // Update position
        node.x += node.vx || 0;
        node.y += node.vy || 0;
        
        // Keep nodes in bounds
        node.x = Math.max(node.radius, Math.min(width - node.radius, node.x));
        node.y = Math.max(node.radius, Math.min(height - node.radius, node.y));
      });
      
      return newNodes;
    });
  }, [width, height]);

  // Drawing function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // High DPI support for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Set the actual size in memory (scaled up)
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    
    // Scale the canvas back down using CSS
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    
    // Scale the drawing context so everything draws at the correct size
    ctx.scale(dpr, dpr);
    
    // Clear canvas
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    // Draw edges
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 2;
    
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      
      if (fromNode && toNode) {
        // Calculate edge endpoints to stop at node borders
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
          const fromX = fromNode.x + (dx / distance) * fromNode.radius;
          const fromY = fromNode.y + (dy / distance) * fromNode.radius;
          const toX = toNode.x - (dx / distance) * toNode.radius;
          const toY = toNode.y - (dy / distance) * toNode.radius;
          
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
          
          // Draw arrow
          const arrowSize = 8;
          const angle = Math.atan2(dy, dx);
          
          ctx.beginPath();
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - arrowSize * Math.cos(angle - Math.PI / 6),
            toY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.moveTo(toX, toY);
          ctx.lineTo(
            toX - arrowSize * Math.cos(angle + Math.PI / 6),
            toY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.stroke();
        }
      }
    });
    
    // Draw nodes
    nodes.forEach(node => {
      // Node shadow
      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
      
      if (node.type === 'company') {
        const gradient = ctx.createRadialGradient(
          node.x - node.radius * 0.3, 
          node.y - node.radius * 0.3, 
          0,
          node.x, 
          node.y, 
          node.radius
        );
        gradient.addColorStop(0, node.color);
        gradient.addColorStop(1, node.color + '80');
        ctx.fillStyle = gradient;
      } else {
        const gradient = ctx.createRadialGradient(
          node.x - node.radius * 0.3, 
          node.y - node.radius * 0.3, 
          0,
          node.x, 
          node.y, 
          node.radius
        );
        gradient.addColorStop(0, '#a855f7');
        gradient.addColorStop(1, '#7c3aed');
        ctx.fillStyle = gradient;
      }
      
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      ctx.restore();
      
      // Node icon
      ctx.fillStyle = 'white';
      ctx.font = `${node.radius * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const icon = node.type === 'company' ? '🏢' : '👤';
      ctx.fillText(icon, node.x, node.y - 2);
      
      // Node label
      ctx.fillStyle = '#1f2937';
      ctx.font = `${node.type === 'company' ? 'bold 12px' : '10px'} Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      const labelY = node.y + node.radius + 8;
      
      // Label background
      const labelWidth = ctx.measureText(node.label).width + 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.fillRect(node.x - labelWidth/2, labelY - 2, labelWidth, 16);
      
      // Label text
      ctx.fillStyle = '#1f2937';
      ctx.fillText(node.label, node.x, labelY);
    });
  }, [nodes, edges, width, height]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      simulate();
      draw();
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [simulate, draw]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Find clicked node
    const clickedNode = nodes.find(node => {
      const dx = x - node.x;
      const dy = y - node.y;
      return Math.sqrt(dx * dx + dy * dy) <= node.radius;
    });
    
    if (clickedNode) {
      setIsDragging(true);
      setDragNode(clickedNode);
      
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === clickedNode.id 
            ? { ...node, isDragging: true }
            : node
        )
      );
    }
  }, [nodes]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });
    
    if (isDragging && dragNode) {
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === dragNode.id 
            ? { ...node, x, y, vx: 0, vy: 0 }
            : node
        )
      );
    } else {
      // Check for hover
      const hoveredNode = nodes.find(node => {
        const dx = x - node.x;
        const dy = y - node.y;
        return Math.sqrt(dx * dx + dy * dy) <= node.radius;
      });
      
      if (hoveredNode) {
        let tooltipText = '';
        if (hoveredNode.type === 'company') {
          tooltipText = `${hoveredNode.company?.company}\n${hoveredNode.company?.sector}\nDirectors: ${hoveredNode.company?.directors.length}`;
        } else {
          tooltipText = `${hoveredNode.director?.name}\n${hoveredNode.director?.position}\n${hoveredNode.company?.company}`;
        }
        
        setTooltip({
          x: hoveredNode.x,
          y: hoveredNode.y - hoveredNode.radius - 10,
          text: tooltipText,
          visible: true
        });
      } else {
        setTooltip(prev => ({ ...prev, visible: false }));
      }
    }
  }, [isDragging, dragNode, nodes]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNode(null);
    
    setNodes(prevNodes => 
      prevNodes.map(node => ({ ...node, isDragging: false }))
    );
  }, []);

  const resetLayout = useCallback(() => {
    // Reset to initial positions
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies.slice(0, 6);

    const centerX = width / 2;
    const centerY = height / 2;
    const companyRadius = Math.min(width, height) / 4;

    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      
      relevantCompanies.forEach((company, i) => {
        const angle = (i * 2 * Math.PI) / relevantCompanies.length;
        const companyNode = newNodes.find(n => n.id === company.ticker);
        if (companyNode) {
          companyNode.x = centerX + Math.cos(angle) * companyRadius;
          companyNode.y = centerY + Math.sin(angle) * companyRadius;
          companyNode.vx = 0;
          companyNode.vy = 0;
        }
        
        // Reset director positions
        company.directors.forEach((_, dirIndex) => {
          const directorId = `dir_${company.ticker}_${dirIndex}`;
          const directorNode = newNodes.find(n => n.id === directorId);
          if (directorNode) {
            const directorAngle = angle + (dirIndex - company.directors.length / 2) * 0.8;
            const directorDistance = companyRadius + 80;
            directorNode.x = centerX + Math.cos(directorAngle) * directorDistance;
            directorNode.y = centerY + Math.sin(directorAngle) * directorDistance;
            directorNode.vx = 0;
            directorNode.vy = 0;
          }
        });
      });
      
      return newNodes;
    });
  }, [companies, selectedCompanyIds, width, height]);

  return (
    <Container>
      <Canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      <Controls>
        <ControlButton onClick={resetLayout}>
          Reset Layout
        </ControlButton>
      </Controls>
      
      <Legend>
        <LegendItem>
          <LegendDot color="#3b82f6" />
          <span>Companies</span>
        </LegendItem>
        <LegendItem>
          <LegendDot color="#8b5cf6" />
          <span>Directors</span>
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