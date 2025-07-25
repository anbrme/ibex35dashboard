import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { BaseType } from 'd3';
import type { SecureIBEXCompanyData } from '../../services/secureGoogleSheetsService';

interface NetworkGraphProps {
  companies: SecureIBEXCompanyData[];
  selectedCompany: SecureIBEXCompanyData | null;
}

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  type: 'company' | 'director';
  sector?: string;
  company?: string;
  position?: string;
  size: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  strength: number;
}

export function NetworkGraph({ companies, selectedCompany }: NetworkGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || companies.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = 800;
    const height = 500;

    // Define color scale for sectors
    const colorScale = d3.scaleOrdinal<string>()
      .domain(companies.map(c => c.sector || ''))
      .range(d3.schemeCategory10);

    // Create nodes and links
    const nodes: Node[] = [];
    const links: Link[] = [];

    // Define force simulation
    const simulation = d3.forceSimulation<Node>()
      .force('link', d3.forceLink<Node, Link>().id(d => d.id).strength(d => (d as Link).strength))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<Node>().radius(d => d.size + 5));


    // Add company nodes
    companies.forEach(company => {
      nodes.push({
        id: company.ticker,
        name: company.company,
        type: 'company',
        sector: company.sector,
        size: Math.max(8, Math.min(20, company.marketCapEur / 1e10 + 5)),
      });

      // Add director nodes and links
      company.directors.forEach(director => {
        const directorId = `director-${director.name.replace(/\s+/g, '-')}`;
        
        // Check if director already exists (serves on multiple boards)
        if (!nodes.find(n => n.id === directorId)) {
          nodes.push({
            id: directorId,
            name: director.name,
            type: 'director',
            position: director.position,
            size: 6,
          });
        }

        // Create link between company and director
        links.push({
          source: company.ticker,
          target: directorId,
          strength: 1,
        });
      });
    });

    // Create cross-links for directors serving on multiple boards
    const directorCompanies = new Map<string, string[]>();
    companies.forEach(company => {
      company.directors.forEach(director => {
        const directorId = `director-${director.name.replace(/\s+/g, '-')}`;
        if (!directorCompanies.has(directorId)) {
          directorCompanies.set(directorId, []);
        }
        directorCompanies.get(directorId)!.push(company.ticker);
      });
    });

    // Add nodes to the SVG
    const nodeElements = svg.append('g')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => d.size)
      .attr('fill', d => d.type === 'company' ? colorScale(d.sector || '') : '#ccc')
      .call(d3.drag<SVGCircleElement, Node>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          (d as Node).fx = d.x;
          (d as Node).fy = d.y;
        })
        .on('drag', (event, d) => {
          (d as Node).fx = event.x;
          (d as Node).fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          (d as Node).fx = null;
          (d as Node).fy = null;
        }));

    // Add links to the SVG
    const linkElements = svg.append('g')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke-width', 1)
      .attr('stroke', '#999')
      .attr('stroke-dasharray', d => d.strength < 1 ? '4 2' : 'none');

    // Update simulation on tick
    simulation.on('tick', () => {
      nodeElements
        .attr('cx', d => d.x!)
        .attr('cy', d => d.y!);

      linkElements
        .attr('x1', d => (d.source as Node).x!)
        .attr('y1', d => (d.source as Node).y!)
        .attr('x2', d => (d.target as Node).x!)
        .attr('y2', d => (d.target as Node).y!);
    });
    directorCompanies.forEach((companyList) => {
      if (companyList.length > 1) {
        for (let i = 0; i < companyList.length - 1; i++) {
          for (let j = i + 1; j < companyList.length; j++) {
            links.push({
              source: companyList[i],
              target: companyList[j],
              strength: 0.3,
            });
          }
        }
      }
    });



    // Create links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", d => d.strength > 0.5 ? "#f59e0b" : "#6b7280")
      .attr("stroke-opacity", d => d.strength > 0.5 ? 0.8 : 0.3)
      .attr("stroke-width", d => d.strength > 0.5 ? 2 : 1);

    // Create nodes
    const node = svg.append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", d => (d as Node).size)
      .attr("fill", d => {
        if (d.type === 'company') {
          return selectedCompany && d.id === selectedCompany.ticker 
            ? "#f59e0b" 
            : colorScale(d.sector || '');
        }
        return "#8b5cf6";
      })
      .attr("stroke", "#ffffff")
      .attr("stroke-width", d => {
        if (selectedCompany && d.type === 'company') {
          return d.id === selectedCompany.ticker ? 3 : 1;
        }
        return 1;
      })
      .attr("opacity", d => {
        if (selectedCompany) {
          // Highlight selected company and its connections
          if (d.type === 'company' && d.id === selectedCompany.ticker) return 1;
          if (d.type === 'director') {
            // Check if this director is connected to selected company
            const isConnected = selectedCompany.directors.some(dir => 
              `director-${dir.name.replace(/\s+/g, '-')}` === d.id
            );
            return isConnected ? 1 : 0.3;
          }
          return 0.3;
        }
        return 1;
      });

    // Add labels
    const labels = svg.append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text(d => {
        if (d.type === 'company') {
          return d.name.length > 12 ? d.name.substring(0, 12) + '...' : d.name;
        }
        const firstName = d.name.split(' ')[0];
        const lastName = d.name.split(' ').slice(-1)[0];
        return firstName !== lastName ? `${firstName} ${lastName}` : firstName;
      })
      .attr("font-size", d => d.type === 'company' ? 11 : 9)
      .attr("font-weight", d => d.type === 'company' ? "bold" : "normal")
      .attr("fill", "#e5e7eb")
      .attr("text-anchor", "middle")
      .attr("dy", d => (d as Node).size + 15)
      .attr("opacity", d => {
        if (selectedCompany) {
          if (d.type === 'company' && d.id === selectedCompany.ticker) return 1;
          if (d.type === 'director') {
            const isConnected = selectedCompany.directors.some(dir => 
              `director-${dir.name.replace(/\s+/g, '-')}` === d.id
            );
            return isConnected ? 1 : 0.2;
          }
          return 0.2;
        }
        return 1;
      });

    // Add drag behavior
    const drag = d3.drag<SVGCircleElement, Node>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag as unknown as (selection: d3.Selection<BaseType | SVGCircleElement, Node, SVGGElement, unknown>) => void);

    // Add tooltips
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    node
      .on("mouseover", (_, d) => {
        tooltip.style("visibility", "visible");
        if (d.type === 'company') {
          const company = companies.find(c => c.ticker === d.id);
          tooltip.html(`
            <strong>${d.name}</strong><br/>
            Sector: ${d.sector}<br/>
            Market Cap: €${(company!.marketCapEur / 1e9).toFixed(1)}B<br/>
            Directors: ${company!.directors.length}
          `);
        } else {
          tooltip.html(`
            <strong>${d.name}</strong><br/>
            Type: Director<br/>
            Position: ${d.position || 'N/A'}
          `);
        }
      })
      .on("click", (_, d) => {
        if (d.type === 'company') {
          const company = companies.find(c => c.ticker === d.id);
          if (company) {
            if (company.shareholders) {
              alert(`Shareholders of ${company.company}:\n` + company.shareholders.map(s => s.name).join('\n'));
            } else {
              alert(`No shareholder information available for ${company.company}.`);
            }
          }
        }
      })
      .on("mousemove", (event: MouseEvent) => {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", () => {
        tooltip.style("visibility", "hidden");
      });

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as Node).x!)
        .attr("y1", d => (d.source as Node).y!)
        .attr("x2", d => (d.target as Node).x!)
        .attr("y2", d => (d.target as Node).y!);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      labels
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    // Cleanup function
    return () => {
      tooltip.remove();
      simulation.stop();
    };

  }, [companies, selectedCompany]);

  return (
    <div className="w-full h-full flex items-center justify-center bg-muted/20 rounded-lg">
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox="0 0 800 500"
        className="border border-border rounded"
      />
    </div>
  );
}