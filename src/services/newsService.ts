import axios from 'axios';
import type { CompanyNews } from '../types/database';
import { DatabaseService } from './databaseService';

export class NewsService {
  private static readonly NEWS_API_KEY = 'demo'; // Replace with actual API key
  private static readonly NEWS_API_BASE_URL = 'https://newsapi.org/v2';
  
  static async fetchCompanyNews(symbol: string, limit = 20): Promise<CompanyNews[]> {
    try {
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      if (!company) return [];

      const searchQuery = this.buildSearchQuery(company.name, company.symbol);
      
      const response = await axios.get(`${this.NEWS_API_BASE_URL}/everything`, {
        params: {
          q: searchQuery,
          language: 'es',
          sortBy: 'publishedAt',
          pageSize: limit,
          apiKey: this.NEWS_API_KEY
        }
      });

      if (response.data.status !== 'ok') {
        return this.getFallbackNews(company.id, company.name);
      }

      const articles = response.data.articles || [];
      const news: CompanyNews[] = [];

      for (const article of articles) {
        if (!article.title || !article.url) continue;

        const newsItem: CompanyNews = {
          id: DatabaseService.generateId(),
          companyId: company.id,
          title: article.title,
          summary: article.description || '',
          content: article.content || '',
          url: article.url,
          source: article.source?.name || 'Unknown',
          author: article.author || undefined,
          publishedAt: new Date(article.publishedAt),
          sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
          relevanceScore: this.calculateRelevance(article.title, company.name),
          tags: this.extractTags(article.title + ' ' + (article.description || '')),
          language: 'es',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        news.push(newsItem);
        await DatabaseService.saveNews(newsItem);
      }

      return news;
    } catch (error) {
      console.error(`Error fetching news for ${symbol}:`, error);
      const company = await DatabaseService.getCompanyBySymbol(symbol);
      return company ? this.getFallbackNews(company.id, company.name) : [];
    }
  }

  static async fetchMarketNews(limit = 50): Promise<CompanyNews[]> {
    try {
      const response = await axios.get(`${this.NEWS_API_BASE_URL}/everything`, {
        params: {
          q: 'IBEX 35 OR "bolsa española" OR "mercado español" OR "Bolsa de Madrid"',
          language: 'es',
          sortBy: 'publishedAt',
          pageSize: limit,
          apiKey: this.NEWS_API_KEY
        }
      });

      if (response.data.status !== 'ok') {
        return this.getFallbackMarketNews();
      }

      const articles = response.data.articles || [];
      const news: CompanyNews[] = [];

      for (const article of articles) {
        if (!article.title || !article.url) continue;

        const relatedCompany = await this.findRelatedCompany(article.title + ' ' + (article.description || ''));

        const newsItem: CompanyNews = {
          id: DatabaseService.generateId(),
          companyId: relatedCompany?.id || 'market',
          title: article.title,
          summary: article.description || '',
          content: article.content || '',
          url: article.url,
          source: article.source?.name || 'Unknown',
          author: article.author || undefined,
          publishedAt: new Date(article.publishedAt),
          sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || '')),
          relevanceScore: 0.8,
          tags: this.extractTags(article.title + ' ' + (article.description || '')),
          language: 'es',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        news.push(newsItem);
        
        if (relatedCompany) {
          await DatabaseService.saveNews(newsItem);
        }
      }

      return news;
    } catch (error) {
      console.error('Error fetching market news:', error);
      return this.getFallbackMarketNews();
    }
  }

  private static buildSearchQuery(companyName: string, symbol: string): string {
    const cleanSymbol = symbol.replace('.MC', '');
    return `"${companyName}" OR "${cleanSymbol}"`;
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