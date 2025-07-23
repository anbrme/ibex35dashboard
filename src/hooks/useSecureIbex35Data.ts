import { useState, useEffect, useCallback } from 'react';
import type { SecureIBEXCompanyData } from '../services/secureGoogleSheetsService';
import { SecureGoogleSheetsService } from '../services/secureGoogleSheetsService';

export const useSecureIbex35Data = () => {
  const [companies, setCompanies] = useState<SecureIBEXCompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SecureGoogleSheetsService.fetchRealIBEXData();
      setCompanies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch IBEX 35 data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { companies, loading, error, refetch: fetchData };
};