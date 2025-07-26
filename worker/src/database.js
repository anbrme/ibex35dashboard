// D1 Database Operations for IBEX 35 Intelligence Dashboard

export class DatabaseService {
  constructor(db) {
    this.db = db;
  }

  // Sync companies data from Google Sheets to D1
  async syncCompaniesData(companiesData) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO companies (
        id, ticker, name, sector, current_price_eur, 
        market_cap_eur, volume, pe_ratio, eps, high_52, low_52, 
        price_change, change_percent, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const batch = companiesData.map(company => 
      stmt.bind(
        company.ticker, // Use ticker as ID
        company.ticker,
        company.company,
        company.sector,
        company.currentPriceEur,
        company.marketCapEur,
        company.volumeEur,
        company.peRatio,
        company.eps,
        company.high52,
        company.low52,
        company.priceChange,
        company.changePercent
      )
    );

    const results = await this.db.batch(batch);
    return {
      success: true,
      recordsProcessed: results.length,
      changes: results.reduce((sum, r) => sum + r.changes, 0)
    };
  }

  // Sync directors data
  async syncDirectorsData(companiesWithDirectors) {
    try {
      const peopleStmt = this.db.prepare(`
        INSERT OR IGNORE INTO people (id, name, bio) 
        VALUES (?, ?, ?)
      `);
      
      const positionsStmt = this.db.prepare(`
        INSERT OR REPLACE INTO board_positions (
          id, company_id, person_id, position, appointed_date
        ) VALUES (?, ?, ?, ?, ?)
      `);

      const allDirectors = new Map();
      const allPositions = [];

      // Extract all unique directors and their positions
      companiesWithDirectors.forEach(company => {
        if (company.directors && company.directors.length > 0) {
          company.directors.forEach(director => {
            const directorId = `person_${director.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
            allDirectors.set(directorId, {
              id: directorId,
              name: director.name,
              bio: director.bioUrl || null
            });

            allPositions.push({
              id: `pos_${company.ticker}_${directorId}`,
              companyId: company.ticker,
              personId: directorId,
              position: director.position || 'Director',
              appointedDate: director.appointmentDate || null
            });
          });
        }
      });

      console.log(`👥 Processing ${allDirectors.size} directors and ${allPositions.length} positions`);

      // Insert directors first
      if (allDirectors.size > 0) {
        const peopleBatch = Array.from(allDirectors.values()).map(person =>
          peopleStmt.bind(person.id, person.name, person.bio)
        );
        const peopleResults = await this.db.batch(peopleBatch);
        console.log(`✅ Inserted ${peopleResults.length} directors`);
      }

      // Then insert positions (after directors exist)
      if (allPositions.length > 0) {
        const positionsBatch = allPositions.map(pos =>
          positionsStmt.bind(pos.id, pos.companyId, pos.personId, pos.position, pos.appointedDate)
        );
        const positionsResults = await this.db.batch(positionsBatch);
        console.log(`✅ Inserted ${positionsResults.length} positions`);
        
        return {
          success: true,
          peopleProcessed: allDirectors.size,
          positionsProcessed: positionsResults.length
        };
      }

      return {
        success: true,
        peopleProcessed: allDirectors.size,
        positionsProcessed: 0
      };
    } catch (error) {
      console.error('❌ Error syncing directors:', error);
      throw error;
    }
  }

  // Sync shareholders data
  async syncShareholdersData(companiesWithShareholders) {
    try {
      const shareholdersStmt = this.db.prepare(`
        INSERT OR REPLACE INTO company_shareholders (
          id, company_id, ticker, name, type, percentage, shares, report_date, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const allShareholders = [];

      // Extract all shareholders
      companiesWithShareholders.forEach(company => {
        if (company.shareholders && company.shareholders.length > 0) {
          company.shareholders.forEach(shareholder => {
            const shareholderId = `shareholder_${company.ticker}_${shareholder.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
            
            allShareholders.push({
              id: shareholderId,
              companyId: company.ticker,
              ticker: company.ticker,
              name: shareholder.name,
              type: this.determineShareholderType(shareholder.name),
              percentage: parseFloat(shareholder.percentage) || 0,
              shares: parseInt(shareholder.shares) || 0,
              reportDate: shareholder.date || new Date().toISOString().split('T')[0],
              isActive: true
            });
          });
        }
      });

      console.log(`📊 Processing ${allShareholders.length} shareholders`);

      if (allShareholders.length > 0) {
        const shareholdersBatch = allShareholders.map(shareholder =>
          shareholdersStmt.bind(
            shareholder.id,
            shareholder.companyId,
            shareholder.ticker,
            shareholder.name,
            shareholder.type,
            shareholder.percentage,
            shareholder.shares,
            shareholder.reportDate,
            shareholder.isActive
          )
        );
        
        const shareholdersResults = await this.db.batch(shareholdersBatch);
        console.log(`✅ Inserted ${shareholdersResults.length} shareholders`);
        
        return {
          success: true,
          shareholdersProcessed: shareholdersResults.length
        };
      }

      return {
        success: true,
        shareholdersProcessed: 0
      };
    } catch (error) {
      console.error('❌ Error syncing shareholders:', error);
      throw error;
    }
  }

  // Helper function to determine shareholder type
  determineShareholderType(name) {
    const lowerName = name.toLowerCase();
    
    if (lowerName.includes('blackrock') || lowerName.includes('vanguard') || 
        lowerName.includes('fidelity') || lowerName.includes('state street') ||
        lowerName.includes('capital') || lowerName.includes('fund') ||
        lowerName.includes('asset') || lowerName.includes('management')) {
      return 'institutional';
    }
    
    if (lowerName.includes('government') || lowerName.includes('state') ||
        lowerName.includes('ministry') || lowerName.includes('treasury')) {
      return 'government';
    }
    
    if (lowerName.includes('insider') || lowerName.includes('executive') ||
        lowerName.includes('director') || lowerName.includes('ceo') ||
        lowerName.includes('president')) {
      return 'insider';
    }
    
    // If it contains common individual name patterns, classify as individual
    if (lowerName.split(' ').length <= 3 && !lowerName.includes('inc') && 
        !lowerName.includes('ltd') && !lowerName.includes('corp') &&
        !lowerName.includes('sa') && !lowerName.includes('sl')) {
      return 'individual';
    }
    
    return 'other';
  }

  // Get all companies with directors and shareholders
  async getAllCompaniesWithDirectors() {
    const companies = await this.db.prepare(`
      SELECT 
        c.id, c.ticker, c.name, c.sector, c.sub_sector, c.isin,
        c.current_price_eur, c.market_cap_eur, c.volume, c.change_percent,
        c.price_change, c.pe_ratio, c.eps, c.high_52, c.low_52,
        c.dividend_yield, c.website, c.created_at, c.updated_at,
        json_group_array(
          DISTINCT json_object(
            'name', p.name,
            'position', bp.position,
            'appointedDate', bp.appointed_date,
            'bio', p.bio
          )
        ) FILTER (WHERE p.id IS NOT NULL) as directors,
        (
          SELECT json_group_array(
            json_object(
              'name', cs.name,
              'type', cs.type,
              'percentage', cs.percentage,
              'shares', cs.shares,
              'reportDate', cs.report_date
            )
          )
          FROM company_shareholders cs
          WHERE cs.company_id = c.id AND cs.is_active = 1
        ) as shareholders
      FROM companies c
      LEFT JOIN board_positions bp ON c.id = bp.company_id
      LEFT JOIN people p ON bp.person_id = p.id
      GROUP BY c.id
      ORDER BY c.market_cap_eur DESC
    `).all();

    return companies.results.map(company => ({
      ...company,
      directors: company.directors ? JSON.parse(company.directors) : [],
      shareholders: company.shareholders ? JSON.parse(company.shareholders) : []
    }));
  }

  // Get company with directors and shareholders by ticker
  async getCompanyByTicker(ticker) {
    const result = await this.db.prepare(`
      SELECT 
        c.id, c.ticker, c.name, c.sector, c.sub_sector, c.isin,
        c.current_price_eur, c.market_cap_eur, c.volume, c.change_percent,
        c.price_change, c.pe_ratio, c.eps, c.high_52, c.low_52,
        c.dividend_yield, c.website, c.created_at, c.updated_at,
        json_group_array(
          DISTINCT json_object(
            'name', p.name,
            'position', bp.position,
            'appointedDate', bp.appointed_date,
            'bio', p.bio
          )
        ) FILTER (WHERE p.id IS NOT NULL) as directors,
        (
          SELECT json_group_array(
            json_object(
              'name', cs.name,
              'type', cs.type,
              'percentage', cs.percentage,
              'shares', cs.shares,
              'reportDate', cs.report_date
            )
          )
          FROM company_shareholders cs
          WHERE cs.company_id = c.id AND cs.is_active = 1
        ) as shareholders
      FROM companies c
      LEFT JOIN board_positions bp ON c.id = bp.company_id
      LEFT JOIN people p ON bp.person_id = p.id
      WHERE c.ticker = ?
      GROUP BY c.id
    `).bind(ticker).first();

    if (!result) return null;

    return {
      ...result,
      directors: result.directors ? JSON.parse(result.directors) : [],
      shareholders: result.shareholders ? JSON.parse(result.shareholders) : []
    };
  }

  // Get network data for visualization
  async getNetworkData(selectedTickers = []) {
    const companiesFilter = selectedTickers.length > 0 
      ? `WHERE c.ticker IN (${selectedTickers.map(() => '?').join(',')})` 
      : '';

    const query = `
      SELECT 
        c.ticker as company_ticker,
        c.name as company_name,
        c.sector,
        p.name as director_name,
        bp.position,
        (
          SELECT json_group_array(DISTINCT other_c.ticker)
          FROM board_positions other_bp
          JOIN companies other_c ON other_bp.company_id = other_c.id
          WHERE other_bp.person_id = p.id AND other_c.ticker != c.ticker
        ) as other_companies
      FROM companies c
      JOIN board_positions bp ON c.id = bp.company_id
      JOIN people p ON bp.person_id = p.id
      ${companiesFilter}
      ORDER BY c.market_cap_eur DESC
    `;

    const params = selectedTickers.length > 0 ? selectedTickers : [];
    const results = await this.db.prepare(query).bind(...params).all();

    return results.results.map(row => ({
      ...row,
      other_companies: row.other_companies ? JSON.parse(row.other_companies) : []
    }));
  }

  // Record sync operation
  async logSyncOperation(syncType, recordsProcessed, status = 'completed', errorMessage = null) {
    await this.db.prepare(`
      INSERT INTO sync_logs (sync_type, completed_at, status, records_processed, error_message)
      VALUES (?, CURRENT_TIMESTAMP, ?, ?, ?)
    `).bind(syncType, status, recordsProcessed, errorMessage).run();
  }

  // Get latest sync status
  async getLatestSyncStatus() {
    const results = await this.db.prepare(`
      SELECT sync_type, MAX(started_at) as last_sync, status, records_processed
      FROM sync_logs
      GROUP BY sync_type
      ORDER BY last_sync DESC
    `).all();

    return results.results;
  }

  // Add market data history point
  async addMarketDataPoint(companyId, price, volume, marketCap) {
    await this.db.prepare(`
      INSERT INTO market_data_history (
        id, company_id, price, volume, market_cap
      ) VALUES (?, ?, ?, ?, ?)
    `).bind(
      `history_${companyId}_${Date.now()}`,
      companyId,
      price,
      volume,
      marketCap
    ).run();
  }

  // Get market trends for a company
  async getMarketTrends(ticker, days = 30) {
    const results = await this.db.prepare(`
      SELECT price, volume, market_cap, timestamp
      FROM market_data_history
      WHERE company_id = ?
      AND timestamp >= datetime('now', '-${days} days')
      ORDER BY timestamp ASC
    `).bind(ticker).all();

    return results.results;
  }

  // News operations
  async saveNewsItem(newsItem) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO news_items (
        id, company_id, title, summary, content, url, source, author,
        published_at, sentiment, sentiment_score, relevance_score, 
        tags, language, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const result = await stmt.bind(
      newsItem.id,
      newsItem.companyId,
      newsItem.title,
      newsItem.summary,
      newsItem.content,
      newsItem.url,
      newsItem.source,
      newsItem.author,
      newsItem.publishedAt,
      newsItem.sentiment,
      newsItem.sentimentScore || 0,
      newsItem.relevanceScore || 0,
      JSON.stringify(newsItem.tags || []),
      newsItem.language || 'es'
    ).run();

    return { success: true, changes: result.changes };
  }

  async saveMultipleNewsItems(newsItems) {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO news_items (
        id, company_id, title, summary, content, url, source, author,
        published_at, sentiment, sentiment_score, relevance_score, 
        tags, language, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);

    const batch = newsItems.map(newsItem => 
      stmt.bind(
        newsItem.id,
        newsItem.companyId,
        newsItem.title,
        newsItem.summary,
        newsItem.content,
        newsItem.url,
        newsItem.source,
        newsItem.author,
        newsItem.publishedAt,
        newsItem.sentiment,
        newsItem.sentimentScore || 0,
        newsItem.relevanceScore || 0,
        JSON.stringify(newsItem.tags || []),
        newsItem.language || 'es'
      )
    );

    const results = await this.db.batch(batch);
    return {
      success: true,
      recordsProcessed: results.length,
      changes: results.reduce((sum, r) => sum + r.changes, 0)
    };
  }

  async getNewsForCompany(companyId, limit = 20) {
    const results = await this.db.prepare(`
      SELECT id, company_id, title, summary, content, url, source, author,
             published_at, sentiment, sentiment_score, relevance_score,
             tags, language, created_at, updated_at
      FROM news_items
      WHERE company_id = ?
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(companyId, limit).all();

    return results.results.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : []
    }));
  }

  async getNewsForCompanies(companyIds, limit = 50) {
    if (!companyIds.length) return [];
    
    const placeholders = companyIds.map(() => '?').join(',');
    const results = await this.db.prepare(`
      SELECT id, company_id, title, summary, content, url, source, author,
             published_at, sentiment, sentiment_score, relevance_score,
             tags, language, created_at, updated_at
      FROM news_items
      WHERE company_id IN (${placeholders})
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(...companyIds, limit).all();

    return results.results.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : []
    }));
  }

  async getMarketNews(limit = 50) {
    const results = await this.db.prepare(`
      SELECT id, company_id, title, summary, content, url, source, author,
             published_at, sentiment, sentiment_score, relevance_score,
             tags, language, created_at, updated_at
      FROM news_items
      WHERE company_id = 'market'
      ORDER BY published_at DESC
      LIMIT ?
    `).bind(limit).all();

    return results.results.map(item => ({
      ...item,
      tags: item.tags ? JSON.parse(item.tags) : []
    }));
  }

  async getNewsSentimentAnalysis(companyId, days = 30) {
    const results = await this.db.prepare(`
      SELECT 
        sentiment,
        COUNT(*) as count,
        AVG(sentiment_score) as avg_score,
        DATE(published_at) as date
      FROM news_items
      WHERE company_id = ? 
      AND published_at >= datetime('now', '-${days} days')
      GROUP BY sentiment, DATE(published_at)
      ORDER BY date DESC
    `).bind(companyId).all();

    return results.results;
  }

  async getNewsAnalyticsOverview(days = 30) {
    const results = await this.db.prepare(`
      SELECT 
        c.ticker,
        c.name,
        COUNT(n.id) as news_count,
        AVG(n.sentiment_score) as avg_sentiment,
        AVG(n.relevance_score) as avg_relevance,
        MAX(n.published_at) as latest_news
      FROM companies c
      LEFT JOIN news_items n ON c.id = n.company_id
      WHERE n.published_at >= datetime('now', '-${days} days')
      GROUP BY c.id, c.ticker, c.name
      HAVING news_count > 0
      ORDER BY news_count DESC, avg_sentiment DESC
    `).all();

    return results.results;
  }
}