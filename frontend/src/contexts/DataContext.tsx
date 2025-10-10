/**
 * Simple Data Sharing Architecture
 *
 * This system eliminates duplicate API calls by:
 * 1. Centralized data storage in React Context
 * 2. Simple caching mechanism
 * 3. Data sharing between components
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import { APIService } from "../services/api";

// Data types - matching API service types
export interface CompanyData {
  ticker: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  market_cap: number;
  pe_ratio: number;
  historical_data?: any[];
  beta?: number;
  eps?: number;
  avg_volume?: number;
  day_low?: number;
  day_high?: number;
  fifty_two_week_low?: number;
  fifty_two_week_high?: number;
}

export interface CompanyInfo {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  website: string;
  description: string;
  employees: number;
  city: string;
  state: string;
  country: string;
  exchange: string;
  currency: string;
  founded_year?: number;
  ceo?: string;
  last_updated: string;
}

export interface AnnualEBITData {
  ticker: string;
  ebit_data: Array<{
    year: number;
    ebit: number;
    ebit_formatted: string;
    growth_rate?: number;
  }>;
  summary: {
    latest_ebit: number;
    latest_year: number;
    oldest_ebit: number;
    oldest_year: number;
    average_growth_rate: number;
  };
}

// Simple cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Data state interface
interface DataState {
  companies: Record<string, CacheEntry<CompanyData>>;
  companyInfo: Record<string, CacheEntry<CompanyInfo>>;
  ebitData: Record<string, CacheEntry<AnnualEBITData>>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

// Context interface
interface DataContextType {
  getCompanyData: (ticker: string) => CompanyData | null;
  getCompanyInfo: (ticker: string) => CompanyInfo | null;
  getEBITData: (ticker: string) => AnnualEBITData | null;
  fetchCompanyData: (ticker: string) => Promise<CompanyData>;
  fetchCompanyInfo: (ticker: string) => Promise<CompanyInfo>;
  fetchEBITData: (ticker: string) => Promise<AnnualEBITData>;
  isLoading: (key: string) => boolean;
  getError: (key: string) => string | null;
  clearCache: (ticker: string) => void;
}

// Create context
const DataContext = createContext<DataContextType | undefined>(undefined);

// Provider component
export const DataProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<DataState>({
    companies: {},
    companyInfo: {},
    ebitData: {},
    loading: {},
    errors: {},
  });

  // Helper function to check if cache entry is valid (5 minutes)
  const isCacheValid = useCallback((timestamp: number): boolean => {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return now - timestamp < fiveMinutes;
  }, []);

  // Data getters
  const getCompanyData = useCallback(
    (ticker: string): CompanyData | null => {
      const entry = state.companies[ticker];
      return entry && isCacheValid(entry.timestamp) ? entry.data : null;
    },
    [state.companies, isCacheValid],
  );

  const getCompanyInfo = useCallback(
    (ticker: string): CompanyInfo | null => {
      const entry = state.companyInfo[ticker];
      return entry && isCacheValid(entry.timestamp) ? entry.data : null;
    },
    [state.companyInfo, isCacheValid],
  );

  const getEBITData = useCallback(
    (ticker: string): AnnualEBITData | null => {
      const entry = state.ebitData[ticker];
      return entry && isCacheValid(entry.timestamp) ? entry.data : null;
    },
    [state.ebitData, isCacheValid],
  );

  // Data fetchers
  const fetchCompanyData = useCallback(
    async (ticker: string): Promise<CompanyData> => {
      const cacheKey = `companies_${ticker}`;

      // Check if we have valid cached data
      const cacheEntry = state.companies[ticker];
      if (cacheEntry && isCacheValid(cacheEntry.timestamp)) {
        console.log(`📦 Using cached company data for ${ticker}`);
        return cacheEntry.data;
      }

      // Set loading state
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, [cacheKey]: true },
        errors: { ...prev.errors, [cacheKey]: null },
      }));

      try {
        console.log(`🌐 Fetching fresh company data for ${ticker}`);
        const data = await APIService.getStockData(ticker);

        // Store in cache
        setState((prev) => ({
          ...prev,
          companies: {
            ...prev.companies,
            [ticker]: {
              data: data,
              timestamp: Date.now(),
            },
          },
          loading: { ...prev.loading, [cacheKey]: false },
          errors: { ...prev.errors, [cacheKey]: null },
        }));

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, [cacheKey]: false },
          errors: { ...prev.errors, [cacheKey]: errorMessage },
        }));
        throw error;
      }
    },
    [state.companies, isCacheValid],
  );

  const fetchCompanyInfo = useCallback(
    async (ticker: string): Promise<CompanyInfo> => {
      const cacheKey = `companyInfo_${ticker}`;

      // Check if we have valid cached data
      const cacheEntry = state.companyInfo[ticker];
      if (cacheEntry && isCacheValid(cacheEntry.timestamp)) {
        console.log(`📦 Using cached company info for ${ticker}`);
        return cacheEntry.data;
      }

      // Set loading state
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, [cacheKey]: true },
        errors: { ...prev.errors, [cacheKey]: null },
      }));

      try {
        console.log(`🌐 Fetching fresh company info for ${ticker}`);
        const data = await APIService.getCompanyInfo(ticker);

        // Store in cache
        setState((prev) => ({
          ...prev,
          companyInfo: {
            ...prev.companyInfo,
            [ticker]: {
              data: data,
              timestamp: Date.now(),
            },
          },
          loading: { ...prev.loading, [cacheKey]: false },
          errors: { ...prev.errors, [cacheKey]: null },
        }));

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, [cacheKey]: false },
          errors: { ...prev.errors, [cacheKey]: errorMessage },
        }));
        throw error;
      }
    },
    [state.companyInfo, isCacheValid],
  );

  const fetchEBITData = useCallback(
    async (ticker: string): Promise<AnnualEBITData> => {
      const cacheKey = `ebitData_${ticker}`;

      // Check if we have valid cached data
      const cacheEntry = state.ebitData[ticker];
      if (cacheEntry && isCacheValid(cacheEntry.timestamp)) {
        console.log(`📦 Using cached EBIT data for ${ticker}`);
        return cacheEntry.data;
      }

      // Set loading state
      setState((prev) => ({
        ...prev,
        loading: { ...prev.loading, [cacheKey]: true },
        errors: { ...prev.errors, [cacheKey]: null },
      }));

      try {
        console.log(`🌐 Fetching fresh EBIT data for ${ticker}`);
        const data = await APIService.getAnnualEBIT(ticker);

        // Store in cache
        setState((prev) => ({
          ...prev,
          ebitData: {
            ...prev.ebitData,
            [ticker]: {
              data: data,
              timestamp: Date.now(),
            },
          },
          loading: { ...prev.loading, [cacheKey]: false },
          errors: { ...prev.errors, [cacheKey]: null },
        }));

        return data;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setState((prev) => ({
          ...prev,
          loading: { ...prev.loading, [cacheKey]: false },
          errors: { ...prev.errors, [cacheKey]: errorMessage },
        }));
        throw error;
      }
    },
    [state.ebitData, isCacheValid],
  );

  // Utility functions
  const isLoading = useCallback(
    (key: string): boolean => {
      return state.loading[key] || false;
    },
    [state.loading],
  );

  const getError = useCallback(
    (key: string): string | null => {
      return state.errors[key] || null;
    },
    [state.errors],
  );

  const clearCache = useCallback((ticker: string) => {
    setState((prev) => ({
      ...prev,
      companies: Object.fromEntries(
        Object.entries(prev.companies).filter(([key]) => key !== ticker),
      ),
      companyInfo: Object.fromEntries(
        Object.entries(prev.companyInfo).filter(([key]) => key !== ticker),
      ),
      ebitData: Object.fromEntries(
        Object.entries(prev.ebitData).filter(([key]) => key !== ticker),
      ),
    }));
  }, []);

  const contextValue: DataContextType = {
    getCompanyData,
    getCompanyInfo,
    getEBITData,
    fetchCompanyData,
    fetchCompanyInfo,
    fetchEBITData,
    isLoading,
    getError,
    clearCache,
  };

  return (
    <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};
