import type { SecureIBEXCompanyData } from './secureGoogleSheetsService';

export interface NetworkMetrics {
  centrality: number;
  betweennessCentrality: number;
  closeness: number;
  degree: number;
  influence: number;
  connections: number;
}

export interface NetworkNode {
  id: string;
  type: 'company' | 'director' | 'shareholder';
  name: string;
  metrics: NetworkMetrics;
  connections: string[];
}

export interface NetworkAnalysis {
  nodes: NetworkNode[];
  totalNodes: number;
  totalEdges: number;
  networkDensity: number;
  averageDegree: number;
  keyInfluencers: NetworkNode[];
  crossBoardDirectors: NetworkNode[];
  majorShareholders: NetworkNode[];
}

class NetworkAnalyticsService {
  calculateNetworkMetrics(companies: SecureIBEXCompanyData[]): NetworkAnalysis {
    if (!companies || companies.length === 0) {
      return {
        nodes: [],
        totalNodes: 0,
        totalEdges: 0,
        networkDensity: 0,
        averageDegree: 0,
        keyInfluencers: [],
        crossBoardDirectors: [],
        majorShareholders: []
      };
    }

    const nodes: NetworkNode[] = [];
    const edges: Array<{ source: string; target: string; type: string }> = [];
    const nodeConnections = new Map<string, Set<string>>();

    // Create company nodes
    companies.forEach(company => {
      if (!company || !company.ticker) return;

      const companyId = company.ticker;
      nodeConnections.set(companyId, new Set());
      
      nodes.push({
        id: companyId,
        type: 'company',
        name: company.company || company.ticker,
        metrics: {
          centrality: 0,
          betweennessCentrality: 0,
          closeness: 0,
          degree: 0,
          influence: 0,
          connections: 0
        },
        connections: []
      });
    });

    // Process directors and create cross-company connections
    const directorsMap = new Map<string, Set<string>>();
    companies.forEach(company => {
      if (!company || !company.ticker || !company.directors) return;

      company.directors.forEach(director => {
        if (!director || !director.name) return;

        const directorKey = director.name.toLowerCase().trim();
        if (!directorsMap.has(directorKey)) {
          directorsMap.set(directorKey, new Set());
        }
        directorsMap.get(directorKey)!.add(company.ticker);
      });
    });

    // Create director nodes and edges
    directorsMap.forEach((companySet, directorKey) => {
      const companiesArray = Array.from(companySet);
      const directorId = `dir_${directorKey.replace(/[^a-z0-9]/g, '_')}`;
      
      // Find director details from first company
      let directorName = directorKey;
      for (const company of companies) {
        if (company.directors) {
          const director = company.directors.find(d => 
            d.name && d.name.toLowerCase().trim() === directorKey
          );
          if (director) {
            directorName = director.name;
            break;
          }
        }
      }

      nodeConnections.set(directorId, new Set(companiesArray));
      
      nodes.push({
        id: directorId,
        type: 'director',
        name: directorName,
        metrics: {
          centrality: 0,
          betweennessCentrality: 0,
          closeness: 0,
          degree: companiesArray.length,
          influence: companiesArray.length > 1 ? companiesArray.length * 2 : 1,
          connections: companiesArray.length
        },
        connections: companiesArray
      });

      // Create edges between director and companies
      companiesArray.forEach(companyTicker => {
        edges.push({
          source: companyTicker,
          target: directorId,
          type: 'board_member'
        });

        // Update company connections
        const companyConnections = nodeConnections.get(companyTicker);
        if (companyConnections) {
          companyConnections.add(directorId);
        }
      });
    });

    // Process shareholders
    const shareholdersMap = new Map<string, { companies: Set<string>; totalPercentage: number }>();
    companies.forEach(company => {
      if (!company || !company.ticker || !company.shareholders) return;

      company.shareholders.forEach(shareholder => {
        if (!shareholder || !shareholder.name) return;

        const shareholderKey = shareholder.name.toLowerCase().trim();
        if (!shareholdersMap.has(shareholderKey)) {
          shareholdersMap.set(shareholderKey, {
            companies: new Set(),
            totalPercentage: 0
          });
        }
        
        const shareholderData = shareholdersMap.get(shareholderKey)!;
        shareholderData.companies.add(company.ticker);
        shareholderData.totalPercentage += (shareholder.percentage || 0);
      });
    });

    // Create shareholder nodes and edges
    shareholdersMap.forEach((shareholderData, shareholderKey) => {
      const companiesArray = Array.from(shareholderData.companies);
      const shareholderId = `shr_${shareholderKey.replace(/[^a-z0-9]/g, '_')}`;
      
      // Find shareholder details from first company
      let shareholderName = shareholderKey;
      for (const company of companies) {
        if (company.shareholders) {
          const shareholder = company.shareholders.find(s => 
            s.name && s.name.toLowerCase().trim() === shareholderKey
          );
          if (shareholder) {
            shareholderName = shareholder.name;
            break;
          }
        }
      }

      nodeConnections.set(shareholderId, new Set(companiesArray));
      
      // Calculate influence based on ownership percentage and cross-company presence
      const influence = (shareholderData.totalPercentage / 100) * 
                       (companiesArray.length > 1 ? companiesArray.length * 1.5 : 1);

      nodes.push({
        id: shareholderId,
        type: 'shareholder',
        name: shareholderName,
        metrics: {
          centrality: 0,
          betweennessCentrality: 0,
          closeness: 0,
          degree: companiesArray.length,
          influence: influence,
          connections: companiesArray.length
        },
        connections: companiesArray
      });

      // Create edges between shareholder and companies
      companiesArray.forEach(companyTicker => {
        edges.push({
          source: companyTicker,
          target: shareholderId,
          type: 'shareholder'
        });

        // Update company connections
        const companyConnections = nodeConnections.get(companyTicker);
        if (companyConnections) {
          companyConnections.add(shareholderId);
        }
      });
    });

    // Calculate centrality metrics
    this.calculateCentralityMetrics(nodes, nodeConnections);

    // Update company metrics based on their connections
    nodes.forEach(node => {
      if (node.type === 'company') {
        const connections = nodeConnections.get(node.id) || new Set();
        node.metrics.connections = connections.size;
        node.metrics.degree = connections.size;
        node.connections = Array.from(connections);
        
        // Calculate company influence based on market cap and connections
        const company = companies.find(c => c.ticker === node.id);
        if (company) {
          const marketCapInfluence = Math.log10(company.marketCapEur + 1) / 10;
          const connectionInfluence = connections.size / nodes.length;
          node.metrics.influence = marketCapInfluence + connectionInfluence;
        }
      }
    });

    // Calculate network statistics
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const maxPossibleEdges = totalNodes * (totalNodes - 1) / 2;
    const networkDensity = maxPossibleEdges > 0 ? totalEdges / maxPossibleEdges : 0;
    const averageDegree = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;

    // Identify key entities
    const keyInfluencers = nodes
      .filter(n => n.metrics.influence > 0)
      .sort((a, b) => b.metrics.influence - a.metrics.influence)
      .slice(0, 10);

    const crossBoardDirectors = nodes
      .filter(n => n.type === 'director' && n.metrics.connections > 1)
      .sort((a, b) => b.metrics.connections - a.metrics.connections);

    const majorShareholders = nodes
      .filter(n => n.type === 'shareholder' && n.metrics.influence > 0.1)
      .sort((a, b) => b.metrics.influence - a.metrics.influence);

    return {
      nodes,
      totalNodes,
      totalEdges,
      networkDensity,
      averageDegree,
      keyInfluencers,
      crossBoardDirectors,
      majorShareholders
    };
  }

  private calculateCentralityMetrics(nodes: NetworkNode[], connections: Map<string, Set<string>>) {
    const nodeIds = nodes.map(n => n.id);
    const nodeCount = nodeIds.length;

    if (nodeCount <= 1) return;

    // Calculate degree centrality (already done above)
    // Calculate betweenness centrality (simplified)
    nodes.forEach(node => {
      let betweenness = 0;
      const nodeConnections = connections.get(node.id) || new Set();
      
      // For each pair of other nodes, check if this node is on shortest path
      for (let i = 0; i < nodeIds.length; i++) {
        for (let j = i + 1; j < nodeIds.length; j++) {
          const nodeA = nodeIds[i];
          const nodeB = nodeIds[j];
          
          if (nodeA === node.id || nodeB === node.id) continue;
          
          // If this node is connected to both A and B, it's potentially on shortest path
          if (nodeConnections.has(nodeA) && nodeConnections.has(nodeB)) {
            betweenness += 1;
          }
        }
      }
      
      node.metrics.betweennessCentrality = betweenness / ((nodeCount - 1) * (nodeCount - 2) / 2);
    });

    // Calculate closeness centrality (simplified)
    nodes.forEach(node => {
      const nodeConnections = connections.get(node.id) || new Set();
      const directConnections = nodeConnections.size;
      
      // Simplified closeness based on direct connections
      node.metrics.closeness = directConnections / (nodeCount - 1);
      
      // Overall centrality score
      node.metrics.centrality = (
        node.metrics.degree / nodeCount +
        node.metrics.betweennessCentrality +
        node.metrics.closeness
      ) / 3;
    });
  }

  getNodeMetrics(nodeId: string, analysis: NetworkAnalysis): NetworkMetrics | null {
    const node = analysis.nodes.find(n => n.id === nodeId);
    return node ? node.metrics : null;
  }

  getInfluenceRanking(analysis: NetworkAnalysis): NetworkNode[] {
    return [...analysis.nodes]
      .sort((a, b) => b.metrics.influence - a.metrics.influence);
  }

  getCentralityRanking(analysis: NetworkAnalysis): NetworkNode[] {
    return [...analysis.nodes]
      .sort((a, b) => b.metrics.centrality - a.metrics.centrality);
  }
}

export const networkAnalyticsService = new NetworkAnalyticsService();