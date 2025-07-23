import { useState, useEffect } from 'react';
import type { Company } from '../types';
import { YahooFinanceService } from '../services/yahooFinanceService';
import { DatabaseService } from '../services/databaseService';

export const useIbex35Data = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await YahooFinanceService.fetchIbex35Companies();
        await DatabaseService.initializeSampleData();
        setCompanies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch IBEX 35 data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const refetch = () => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await YahooFinanceService.fetchIbex35Companies();
        await DatabaseService.initializeSampleData();
        setCompanies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch IBEX 35 data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  };

  return { companies, loading, error, refetch };
};