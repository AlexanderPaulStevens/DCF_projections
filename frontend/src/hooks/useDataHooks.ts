/**
 * Simple Custom Hook for Company Data
 */

import { useEffect, useState } from "react";
import { useData } from "../contexts/DataContext";

// Hook for basic company data (always loaded)
export const useCompanyData = (ticker: string) => {
  const {
    getCompanyData,
    getCompanyInfo,
    fetchCompanyData,
    fetchCompanyInfo,
    isLoading,
    getError,
  } = useData();

  const [isInitialized, setIsInitialized] = useState(false);

  // Get cached data
  const companyData = getCompanyData(ticker);
  const companyInfo = getCompanyInfo(ticker);

  // Loading states
  const loadingCompany = isLoading(`companies_${ticker}`);
  const loadingInfo = isLoading(`companyInfo_${ticker}`);

  // Error states
  const errorCompany = getError(`companies_${ticker}`);
  const errorInfo = getError(`companyInfo_${ticker}`);

  // Fetch data if not available
  useEffect(() => {
    if (!ticker || isInitialized) return;

    const loadData = async () => {
      try {
        setIsInitialized(true);

        // Load both in parallel if not cached
        const promises = [];
        if (!companyData) {
          promises.push(fetchCompanyData(ticker));
        }
        if (!companyInfo) {
          promises.push(fetchCompanyInfo(ticker));
        }

        await Promise.all(promises);
      } catch (error) {
        console.error(`Error loading company data for ${ticker}:`, error);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker, isInitialized]);

  return {
    companyData,
    companyInfo,
    loading: loadingCompany || loadingInfo,
    error: errorCompany || errorInfo,
    isInitialized,
  };
};

// Simple lazy data hook for analysis data
export const useLazyData = (
  ticker: string,
  dataType: string,
  trigger: boolean = false,
) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  // Trigger loading when condition is met
  useEffect(() => {
    if (trigger && !hasTriggered && !data) {
      setHasTriggered(true);
      setLoading(true);

      // Simulate API call - replace with actual API calls
      setTimeout(() => {
        setData({ ticker, dataType, loaded: true });
        setLoading(false);
      }, 1000);
    }
  }, [trigger, hasTriggered, data, ticker, dataType]);

  return {
    data,
    loading,
    hasTriggered,
  };
};

/**
 * Hook for fetching EBIT data with caching
 */
export const useEBITData = (ticker: string) => {
  const { getEBITData, fetchEBITData } = useData();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to get cached data first
        const cachedData = getEBITData(ticker);
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          return;
        }

        // Fetch fresh data
        const freshData = await fetchEBITData(ticker);
        setData(freshData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch EBIT data",
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ticker, getEBITData, fetchEBITData]);

  return {
    data,
    loading,
    error,
  };
};
