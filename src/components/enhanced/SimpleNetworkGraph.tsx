import { useRef, useEffect } from 'react';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface Props {
  companies: SecureIBEXCompanyData[];
  selectedCompanyIds: Set<string>;
  width?: number;
  height?: number;
}

export function SimpleNetworkGraph({ companies, selectedCompanyIds, width = 800, height = 600 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Filter companies based on selection
    const relevantCompanies = selectedCompanyIds.size > 0 
      ? companies.filter(c => selectedCompanyIds.has(c.ticker))
      : companies.slice(0, 8); // Show top 8 if none selected
    
    if (relevantCompanies.length === 0) return;

    // Create nodes for companies
    const companyNodes = relevantCompanies.map((company, i) => ({
      id: company.ticker,
      x: width / 2 + Math.cos(i * 2 * Math.PI / relevantCompanies.length) * 150,
      y: height / 2 + Math.sin(i * 2 * Math.PI / relevantCompanies.length) * 150,
      label: company.formattedTicker || company.ticker,
      type: 'company',
      directorCount: company.directors.length,
      company: company
    }));

    // Create nodes for directors
    const directorNodes: any[] = [];
    const connections: any[] = [];
    
    relevantCompanies.forEach((company, companyIndex) => {
      company.directors.forEach((director, directorIndex) => {
        const directorId = `dir_${director.name.replace(/\s+/g, '_')}`;
        
        // Check if director already exists
        if (!directorNodes.find(d => d.id === directorId)) {
          const angle = (companyIndex * 2 * Math.PI / relevantCompanies.length) + 
                       (directorIndex * 0.3) - 0.15;
          directorNodes.push({
            id: directorId,
            x: width / 2 + Math.cos(angle) * 220,
            y: height / 2 + Math.sin(angle) * 220,
            label: director.name.split(' ').slice(0, 2).join(' '),
            type: 'director',
            director: director
          });
        }

        // Add connection
        connections.push({
          from: company.ticker,
          to: directorId,
          type: 'board_member'
        });
      });
    });

    const allNodes = [...companyNodes, ...directorNodes];

    // Draw connections
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;
    
    connections.forEach(conn => {
      const fromNode = allNodes.find(n => n.id === conn.from);
      const toNode = allNodes.find(n => n.id === conn.to);
      
      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.stroke();
        
        // Draw arrow
        const angle = Math.atan2(toNode.y - fromNode.y, toNode.x - fromNode.x);
        const arrowSize = 8;
        const arrowX = toNode.x - Math.cos(angle) * 25;
        const arrowY = toNode.y - Math.sin(angle) * 25;
        
        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
          arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
          arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    });

    ctx.globalAlpha = 1;

    // Draw nodes
    allNodes.forEach(node => {
      const radius = node.type === 'company' ? 30 : 20;
      const isSelected = selectedCompanyIds.has(node.id);
      
      // Company nodes
      if (node.type === 'company') {
        // Outer glow for selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius + 5, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
          ctx.fill();
        }
        
        // Main circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(
          node.x - 10, node.y - 10, 0,
          node.x, node.y, radius
        );
        gradient.addColorStop(0, '#60a5fa');
        gradient.addColorStop(1, '#3b82f6');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🏢', node.x, node.y - 2);
      } else {
        // Director nodes
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
        const gradient = ctx.createRadialGradient(
          node.x - 5, node.y - 5, 0,
          node.x, node.y, radius
        );
        gradient.addColorStop(0, '#a78bfa');
        gradient.addColorStop(1, '#8b5cf6');
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Icon
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('👤', node.x, node.y - 1);
      }
      
      // Label
      ctx.fillStyle = '#1e293b';
      ctx.font = node.type === 'company' ? 'bold 12px Arial' : '10px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const labelY = node.y + radius + 8;
      
      // Background for label
      const labelWidth = ctx.measureText(node.label).width + 8;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(node.x - labelWidth/2, labelY - 2, labelWidth, 16);
      
      // Label text
      ctx.fillStyle = '#1e293b';
      ctx.fillText(node.label, node.x, labelY);
    });

  }, [companies, selectedCompanyIds, width, height]);

  return (
    <div className="relative w-full h-full">
      <canvas 
        ref={canvasRef} 
        width={width} 
        height={height}
        className="w-full h-full rounded-lg shadow-inner bg-gradient-to-br from-slate-50 to-gray-100" 
      />
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
            <span>Companies</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
            <span>Directors</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1">Interactive network visualization</p>
      </div>
    </div>
  );
}