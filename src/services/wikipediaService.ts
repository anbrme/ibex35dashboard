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
    // Try different name variations - especially important for Spanish names with two surnames
    const nameVariations = this.generateNameVariations(name);
    
    for (const variation of nameVariations) {
      try {
        const cleanName = variation.trim().replace(/\s+/g, '_');
        const response = await fetch(`${this.baseUrl}${encodeURIComponent(cleanName)}`);
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.type !== 'disambiguation') {
            // Validate that this appears to be about a person
            const extract = (data.extract || '').toLowerCase();
            const title = data.title.toLowerCase();
            
            // Check for obvious non-person indicators first
            const nonPersonIndicators = [
              'railway station', 'train station', 'metro station', 'subway station',
              'airport', 'building', 'bridge', 'street', 'avenue', 'road',
              'municipality', 'city', 'town', 'village', 'district',
              'mountain', 'river', 'lake', 'forest', 'park',
              'school', 'university', 'hospital', 'church', 'cathedral',
              'company', 'corporation', 'organization', 'institution',
              'album', 'song', 'film', 'movie', 'book', 'novel'
            ];
            
            const isNotPerson = nonPersonIndicators.some(indicator => 
              title.includes(indicator) || extract.includes(indicator)
            );
            
            if (isNotPerson) {
              console.log(`Skipping "${variation}" - appears to be about: ${data.title}`);
              continue;
            }
            
            const personIndicators = [
              'born', 'died', 'is a', 'was a', 'businessman', 'businesswoman', 
              'executive', 'ceo', 'chairman', 'director', 'president', 'manager',
              'entrepreneur', 'founder', 'politician', 'lawyer', 'engineer',
              'banker', 'economist', 'consultant', 'analyst', 'professor'
            ];
            
            const hasPersonIndicators = personIndicators.some(indicator => 
              extract.includes(indicator)
            );
            
            if (hasPersonIndicators || extract.length === 0) {
              console.log(`Found Wikipedia page for "${name}" using variation: "${variation}"`);
              return {
                title: data.title,
                summary: data.extract || 'No summary available',
                image: data.thumbnail?.source,
                url: data.content_urls?.desktop.page || `https://en.wikipedia.org/wiki/${cleanName}`,
                extract: data.extract || ''
              };
            } else {
              console.log(`Skipping "${variation}" - no person indicators found in: ${data.title}`);
            }
          }
        }
      } catch (error) {
        console.warn(`Wikipedia API error for variation "${variation}":`, error);
        continue;
      }
    }

    // If no direct match found, try query search with the original name
    console.warn(`No direct Wikipedia page found for "${name}", trying query search`);
    return this.searchByQuery(`${name} businessman`);
  }

  private generateNameVariations(fullName: string): string[] {
    const nameParts = fullName.trim().split(/\s+/);
    const variations: string[] = [];
    
    // Priority 1: First Name + First Surname (most common Wikipedia pattern)
    if (nameParts.length >= 2) {
      variations.push(`${nameParts[0]} ${nameParts[1]}`);
    }
    
    // Priority 2: Handle compound first names like "José Luis Montero"
    if (nameParts.length === 3) {
      // Try "José Luis Montero" as compound first name + surname
      variations.push(`${nameParts[0]} ${nameParts[1]} ${nameParts[2]}`);
    }
    
    if (nameParts.length === 4) {
      // For "José Luis Torres Vila", try compound first name + first surname
      variations.push(`${nameParts[0]} ${nameParts[1]} ${nameParts[2]}`);
    }
    
    // Priority 3: Full name
    variations.push(fullName);
    
    // Priority 4: Other less common variations
    if (nameParts.length >= 3) {
      // First + last (skipping middle)
      variations.push(`${nameParts[0]} ${nameParts[nameParts.length - 1]}`);
    }
    
    // Last resort: individual parts (most likely to give wrong results)
    if (nameParts.length >= 2) {
      variations.push(nameParts[1]); // First surname only
    }
    
    // Remove duplicates while preserving order
    return [...new Set(variations)];
  }

  private async searchByQuery(name: string): Promise<WikipediaData | null> {
    try {
      const searchParams = new URLSearchParams({
        action: 'query',
        format: 'json',
        generator: 'search',
        gsrsearch: name,
        gsrlimit: '5', // Get more results to filter through
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

      // Filter and rank results by relevance
      const nameWords = name.toLowerCase().split(' ');
      const scoredPages = pages.map(page => {
        const titleLower = page.title.toLowerCase();
        const extractLower = (page.extract || '').toLowerCase();
        
        let score = 0;
        
        // Exact title match gets highest score
        if (titleLower === name.toLowerCase()) {
          score += 100;
        }
        
        // Title contains all name words
        const titleContainsAllWords = nameWords.every(word => titleLower.includes(word));
        if (titleContainsAllWords) {
          score += 50;
        }
        
        // Count name word matches in title
        const titleMatches = nameWords.filter(word => titleLower.includes(word)).length;
        score += titleMatches * 10;
        
        // Extract contains name words (lower weight)
        const extractMatches = nameWords.filter(word => extractLower.includes(word)).length;
        score += extractMatches * 2;
        
        // Avoid disambiguation pages unless specifically needed
        if (titleLower.includes('disambiguation')) {
          score -= 30;
        }
        
        // Prefer biographical articles for people
        if (extractLower.includes('born') || extractLower.includes('is a') || extractLower.includes('was a')) {
          score += 5;
        }
        
        return { page, score };
      });

      // Sort by score and take the best match
      scoredPages.sort((a, b) => b.score - a.score);
      
      // Only return result if it has a reasonable score
      const bestMatch = scoredPages[0];
      if (bestMatch.score < 10) {
        console.warn(`Low relevance score (${bestMatch.score}) for search: "${name}" -> "${bestMatch.page.title}"`);
        return null;
      }

      const page = bestMatch.page;
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
    // Try more specific company-focused search terms
    const searchTerms = [
      companyName,
      `${companyName} company`,
      `${companyName} corporation`,
      `${companyName} SA`,
      `${companyName} S.A.`,
      `${companyName} Group`,
      `${companyName} Holdings`,
      `${companyName} Limited`
    ];

    for (const term of searchTerms) {
      const result = await this.searchCompanySpecific(term);
      if (result) {
        // Additional validation for company results
        const extract = result.extract.toLowerCase();
        const title = result.title.toLowerCase();
        
        // Check if this looks like a company article
        const companyIndicators = [
          'company', 'corporation', 'multinational', 'business', 'enterprise',
          'industry', 'founded', 'headquarters', 'subsidiary', 'listed',
          'stock exchange', 'market cap', 'revenue', 'employees'
        ];
        
        const hasCompanyIndicators = companyIndicators.some(indicator => 
          extract.includes(indicator) || title.includes(indicator)
        );
        
        if (hasCompanyIndicators) {
          return result;
        }
      }
    }

    return null;
  }

  private async searchCompanySpecific(term: string): Promise<WikipediaData | null> {
    try {
      const cleanTerm = term.trim().replace(/\s+/g, '_');
      const response = await fetch(`${this.baseUrl}${encodeURIComponent(cleanTerm)}`);
      
      if (!response.ok) {
        return this.searchByQuery(term);
      }

      const data = await response.json();
      
      if (data.type === 'disambiguation') {
        return this.searchByQuery(term);
      }

      return {
        title: data.title,
        summary: data.extract || 'No summary available',
        image: data.thumbnail?.source,
        url: data.content_urls?.desktop.page || `https://en.wikipedia.org/wiki/${cleanTerm}`,
        extract: data.extract || ''
      };
    } catch (error) {
      console.warn('Wikipedia company search error:', error);
      return null;
    }
  }
}

export const wikipediaService = new WikipediaService();