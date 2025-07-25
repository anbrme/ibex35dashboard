export interface WikipediaData {
  title: string;
  summary: string;
  image?: string;
  url: string;
  extract: string;
}

export interface WikipediaResponse {
  query?: {
    pages: {
      [key: string]: {
        pageid: number;
        title: string;
        extract?: string;
        thumbnail?: {
          source: string;
          width: number;
          height: number;
        };
        pageimage?: string;
      };
    };
  };
}

class WikipediaService {
  private baseUrl = 'https://en.wikipedia.org/api/rest_v1/page/summary/';
  private searchUrl = 'https://en.wikipedia.org/w/api.php';

  async searchPerson(name: string): Promise<WikipediaData | null> {
    try {
      const cleanName = name.trim().replace(/\s+/g, '_');
      const response = await fetch(`${this.baseUrl}${encodeURIComponent(cleanName)}`);
      
      if (!response.ok) {
        return this.searchByQuery(name);
      }

      const data = await response.json();
      
      if (data.type === 'disambiguation') {
        return this.searchByQuery(name);
      }

      return {
        title: data.title,
        summary: data.extract || 'No summary available',
        image: data.thumbnail?.source,
        url: data.content_urls?.desktop.page || `https://en.wikipedia.org/wiki/${cleanName}`,
        extract: data.extract || ''
      };
    } catch (error) {
      console.warn('Wikipedia API error:', error);
      return null;
    }
  }

  private async searchByQuery(name: string): Promise<WikipediaData | null> {
    try {
      const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: name,
        gsrlimit: '1',
        prop: 'extracts|pageimages',
        exintro: 'true',
        explaintext: 'true',
        exsectionformat: 'plain',
        piprop: 'thumbnail',
        pithumbsize: '300',
        origin: '*'
      });

      const response = await fetch(`${this.searchUrl}?${searchParams}`);
      const data: WikipediaResponse = await response.json();

      if (!data.query?.pages) {
        return null;
      }

      const pages = Object.values(data.query.pages);
      if (pages.length === 0) {
        return null;
      }

      const page = pages[0];
      return {
        title: page.title,
        summary: page.extract || 'No summary available',
        image: page.thumbnail?.source,
        url: `https://en.wikipedia.org/wiki/${page.title.replace(/\s+/g, '_')}`,
        extract: page.extract || ''
      };
    } catch (error) {
      console.warn('Wikipedia search error:', error);
      return null;
    }
  }

  async searchCompany(companyName: string): Promise<WikipediaData | null> {
    const searchTerms = [
      companyName,
      `${companyName} company`,
      `${companyName} corporation`,
      `${companyName} SA`,
      `${companyName} S.A.`
    ];

    for (const term of searchTerms) {
      const result = await this.searchPerson(term);
      if (result) {
        return result;
      }
    }

    return null;
  }
}

export const wikipediaService = new WikipediaService();