/**
 * React Query Hook for EBIT Data
 * Optimized for annual data with long cache
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiService } from "../../services/api";
import { AnnualEBITData, QueryKeys } from "../../types/api";

interface UseEBITDataOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch and cache annual EBIT data
 *
 * @param ticker - Stock ticker symbol
 * @param options - Query options
 * @returns Query result with EBIT data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useEBITData('AAPL');
 * ```
 */
export function useEBITData(
  ticker: string,
  options: UseEBITDataOptions = {}
): UseQueryResult<AnnualEBITData, Error> {
  return useQuery({
    queryKey: QueryKeys.ebitData(ticker),
    queryFn: () => apiService.getAnnualEBIT(ticker),

    // Cache configuration - EBIT data updated annually
    staleTime: 24 * 60 * 60 * 1000, // 1 day - data considered fresh
    gcTime: 60 * 60 * 1000, // 1 hour - garbage collect after

    // Refetch strategy - static annual data
    refetchOnWindowFocus: false,
    refetchOnMount: false,

    // Only fetch if ticker is provided
    enabled: options.enabled !== false && !!ticker,

    // Keep previous data while fetching new ticker
    placeholderData: (previousData) => previousData,
  });
}
