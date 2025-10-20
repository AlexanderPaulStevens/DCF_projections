/**
 * React Query Hook for Financial Ratios
 * Optimized for quarterly-updated data
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiService } from "../../services/api";
import { FinancialRatios, QueryKeys } from "../../types/api";

interface UseFinancialRatiosOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch and cache financial ratios
 *
 * @param ticker - Stock ticker symbol
 * @param options - Query options
 * @returns Query result with financial ratios
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useFinancialRatios('AAPL');
 * ```
 */
export function useFinancialRatios(
  ticker: string,
  options: UseFinancialRatiosOptions = {}
): UseQueryResult<FinancialRatios, Error> {
  return useQuery({
    queryKey: QueryKeys.financialRatios(ticker),
    queryFn: () => apiService.getFinancialRatios(ticker),

    // Cache configuration - ratios updated quarterly
    staleTime: 60 * 60 * 1000, // 1 hour - data considered fresh
    gcTime: 60 * 60 * 1000, // 1 hour - garbage collect after

    // Refetch strategy - static data
    refetchOnWindowFocus: false,
    refetchOnMount: false,

    // Only fetch if ticker is provided
    enabled: options.enabled !== false && !!ticker,

    // Keep previous data while fetching new ticker
    placeholderData: (previousData) => previousData,
  });
}
