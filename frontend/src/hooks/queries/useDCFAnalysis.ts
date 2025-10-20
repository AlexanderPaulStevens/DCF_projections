/**
 * React Query Hook for DCF Analysis
 * User-triggered queries with manual refetch
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiService } from "../../services/api";
import { DCFAnalysis, QueryKeys } from "../../types/api";

interface UseDCFAnalysisOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch and cache DCF analysis
 *
 * This hook does NOT auto-fetch on mount. Call refetch() to trigger.
 *
 * @param ticker - Stock ticker symbol
 * @param options - Query options
 * @returns Query result with DCF analysis and refetch function
 *
 * @example
 * ```tsx
 * const { data, isLoading, refetch } = useDCFAnalysis('AAPL', { enabled: false });
 *
 * // User clicks button
 * <Button onClick={() => refetch()}>Calculate DCF</Button>
 * ```
 */
export function useDCFAnalysis(
  ticker: string,
  options: UseDCFAnalysisOptions = {}
): UseQueryResult<DCFAnalysis, Error> {
  return useQuery({
    queryKey: QueryKeys.dcfAnalysis(ticker),
    queryFn: () => apiService.getDCFAnalysis(ticker),

    // Cache configuration - DCF calculations are expensive
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour - garbage collect after

    // Refetch strategy - manual only
    refetchOnWindowFocus: false,
    refetchOnMount: false,

    // Only fetch if explicitly enabled
    enabled: options.enabled !== false && !!ticker,

    // Keep previous data while fetching new ticker
    placeholderData: (previousData) => previousData,
  });
}
