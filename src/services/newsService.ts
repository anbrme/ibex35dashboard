import type { CompanyNews } from '../types/database';
import { DatabaseService } from './databaseService';

export class NewsService {
  
  static async fetchCompanyNews(symbol: string, limit = 20): Promise<CompanyNews[]> {
    try {
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      if (!company) return [];

      // For now, return fallback news until alternative news sources are implemented
      return this.getFallbackNews(company.id, company.name);
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      return company ? this.getFallbackNews(company.id, company.name) : [];
    }
  }

  static async fetchSelectedCompaniesNews(selectedSymbols: string[], companies: any[], limit = 10): Promise<CompanyNews[]> {
    const allNews: CompanyNews[] = [];
    
    for (const symbol of selectedSymbols) {
      try {
        // Find company in the Google Sheets data
        const company = companies.find(c => c.ticker === symbol);
        
        if (company) {
          // Use company ISIN as ID for fallback news
          const companyNews = this.getFallbackNews(company.isin, company.company);
          allNews.push(...companyNews);
        }
      } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
      }
    }
    
    // Sort by publication date (newest first)
    return allNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime()).slice(0, limit * selectedSymbols.length);
  }

  private static cleanHtmlContent(content: string): string {
    return content
      .replace(/<[^>]*>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }

  static async fetchMarketNews(limit = 50): Promise<CompanyNews[]> {
    try {
      // Return fallback market news until alternative news sources are implemented
      return this.getFallbackMarketNews();
    } catch (error) {
      console.error('Error fetching market news:', error);
      return this.getFallbackMarketNews();
    }
  }


  private static async findRelatedCompany(text: string) {
    const companies = await DatabaseService.getAllCompanies();
    const lowerText = text.toLowerCase();
    
    return companies.find(company => 
      lowerText.includes(company.name.toLowerCase()) ||
      lowerText.includes(company.symbol.toLowerCase().replace('.mc', ''))
    );
  }

  private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = [
      'crecimiento', 'beneficio', 'ganancia', 'aumento', 'subida', 'éxito',
      'mejora', 'récord', 'expansión', 'inversión', 'fortaleza', 'optimismo'
    ];
    
    const negativeWords = [
      'pérdida', 'caída', 'bajada', 'crisis', 'problema', 'dificultad',
      'reducción', 'despido', 'cierre', 'recesión', 'declive', 'riesgo'
    ];

    const lowerText = text.toLowerCase();
    
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static calculateRelevance(title: string, companyName: string): number {
    const lowerTitle = title.toLowerCase();
    const lowerCompanyName = companyName.toLowerCase();
    
    if (lowerTitle.includes(lowerCompanyName)) return 1.0;
    
    const words = lowerCompanyName.split(' ');
    const matchingWords = words.filter(word => lowerTitle.includes(word)).length;
    
    return matchingWords / words.length;
  }

  private static extractTags(text: string): string[] {
    const tags: string[] = [];
    const lowerText = text.toLowerCase();
    
    const tagKeywords = {
      'financiero': ['beneficio', 'pérdida', 'resultado', 'balance', 'dividendo'],
      'mercado': ['bolsa', 'cotización', 'acción', 'mercado', 'índice'],
      'corporativo': ['fusión', 'adquisición', 'estrategia', 'directivo', 'ceo'],
      'regulatorio': ['regulación', 'normativa', 'cnmv', 'comisión', 'sanción'],
      'sostenibilidad': ['sostenible', 'verde', 'renovable', 'esg', 'medioambiente']
    };
    
    for (const [tag, keywords] of Object.entries(tagKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        tags.push(tag);
      }
    }
    
    return tags;
  }

  private static getFallbackNews(companyId: string, companyName: string): CompanyNews[] {
    const baseNews = [
      {
        title: `${companyName} publica resultados trimestrales positivos`,
        summary: `La compañía ha superado las expectativas del mercado con un crecimiento del beneficio neto.`,
        source: 'Expansión',
        sentiment: 'positive' as const,
        tags: ['financiero', 'mercado']
      },
      {
        title: `Análisis técnico de las acciones de ${companyName}`,
        summary: `Los expertos ven potencial alcista en el valor tras la reciente corrección.`,
        source: 'Cinco Días',
        sentiment: 'neutral' as const,
        tags: ['mercado']
      },
      {
        title: `${companyName} anuncia nueva estrategia de sostenibilidad`,
        summary: `La empresa presenta su plan para alcanzar la neutralidad de carbono antes de 2030.`,
        source: 'El Economista',
        sentiment: 'positive' as const,
        tags: ['sostenibilidad', 'corporativo']
      }
    ];

    return baseNews.map((item, index) => ({
      id: DatabaseService.generateId(),
      companyId,
      title: item.title,
      summary: item.summary,
      content: item.summary,
      url: `https://example.com/news/${index}`,
      source: item.source,
      publishedAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000),
      sentiment: item.sentiment,
      relevanceScore: 0.9,
      tags: item.tags,
      language: 'es',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  private static getFallbackMarketNews(): CompanyNews[] {
    const marketNews = [
      {
        title: 'El IBEX 35 cierra con ganancias del 1,2% tras los datos macroeconómicos',
        summary: 'El selectivo español ha registrado una jornada positiva impulsado por el sector bancario.',
        source: 'Bolsamanía',
        sentiment: 'positive' as const
      },
      {
        title: 'Volatilidad en el mercado español ante la incertidumbre geopolítica',
        summary: 'Los inversores muestran cautela mientras evalúan los riesgos globales.',
        source: 'EFE',
        sentiment: 'neutral' as const
      },
      {
        title: 'Nuevas regulaciones ESG impactan en las cotizadas del IBEX 35',
        summary: 'Las empresas españolas se adaptan a los nuevos requisitos de sostenibilidad.',
        source: 'Reuters',
        sentiment: 'neutral' as const
      }
    ];

    return marketNews.map((item, index) => ({
      id: DatabaseService.generateId(),
      companyId: 'market',
      title: item.title,
      summary: item.summary,
      content: item.summary,
      url: `https://example.com/market-news/${index}`,
      source: item.source,
      publishedAt: new Date(Date.now() - index * 60 * 60 * 1000),
      sentiment: item.sentiment,
      relevanceScore: 0.8,
      tags: ['mercado'],
      language: 'es',
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }
}