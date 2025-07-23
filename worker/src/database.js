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
        market_cap_eur, volume, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    const batch = companiesData.map(company => 
      stmt.bind(
        company.ticker, // Use ticker as ID
        company.ticker,
        company.company,
        company.sector,
        company.currentPriceEur,
        company.marketCapEur,
        company.volumeEur
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

  // Get all companies with directors
  async getAllCompaniesWithDirectors() {
    const companies = await this.db.prepare(`
      SELECT 
        c.*,
        json_group_array(
          json_object(
            'name', p.name,
            'position', bp.position,
            'appointedDate', bp.appointed_date,
            'bio', p.bio
          )
        ) FILTER (WHERE p.id IS NOT NULL) as directors
      FROM companies c
      LEFT JOIN board_positions bp ON c.id = bp.company_id
      LEFT JOIN people p ON bp.person_id = p.id
      GROUP BY c.id
      ORDER BY c.market_cap_eur DESC
    `).all();

    return companies.results.map(company => ({
      ...company,
      directors: company.directors ? JSON.parse(company.directors) : []
    }));
  }

  // Get company with directors by ticker
  async getCompanyByTicker(ticker) {
    const result = await this.db.prepare(`
      SELECT 
        c.*,
        json_group_array(
          json_object(
            'name', p.name,
            'position', bp.position,
            'appointedDate', bp.appointed_date,
            'bio', p.bio
          )
        ) FILTER (WHERE p.id IS NOT NULL) as directors
      FROM companies c
      LEFT JOIN board_positions bp ON c.id = bp.company_id
      LEFT JOIN people p ON bp.person_id = p.id
      WHERE c.ticker = ?
      GROUP BY c.id
    `).bind(ticker).first();

    if (!result) return null;

    return {
      ...result,
      directors: result.directors ? JSON.parse(result.directors) : []
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
}