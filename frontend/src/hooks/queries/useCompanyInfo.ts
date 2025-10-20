/**
 * React Query Hook for Company Information
 * Optimized for static data with long cache duration
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiService } from "../../services/api";
import { CompanyInfo, QueryKeys } from "../../types/api";

interface UseCompanyInfoOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch and cache company information
 *
 * @param ticker - Stock ticker symbol
 * @param options - Query options
 * @returns Query result with company info
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useCompanyInfo('AAPL');
 * ```
 */
export function useCompanyInfo(
  ticker: string,
  options: UseCompanyInfoOptions = {}
): UseQueryResult<CompanyInfo, Error> {
  return useQuery({
    queryKey: QueryKeys.companyInfo(ticker),
    queryFn: () => apiService.getCompanyInfo(ticker),

    // Cache configuration - company info rarely changes
    staleTime: 60 * 60 * 1000, // 1 hour - data considered fresh
    gcTime: 60 * 60 * 1000, // 1 hour - garbage collect after

    // Refetch strategy - static data, no need to refetch
    refetchOnWindowFocus: false,
    refetchOnMount: false,

    // Only fetch if ticker is provided
    enabled: options.enabled !== false && !!ticker,

    // Keep previous data while fetching new ticker
    placeholderData: (previousData) => previousData,
  });
}
