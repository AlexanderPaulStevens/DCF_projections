/**
 * React Query Hook for Stock Price Data
 * Optimized for real-time updates with smart refetching
 */

import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { apiService } from "../../services/api";
import { StockPriceData, QueryKeys } from "../../types/api";

interface UseStockPriceOptions {
  enabled?: boolean;
}

/**
 * Hook to fetch and cache stock price data
 *
 * @param ticker - Stock ticker symbol
 * @param options - Query options
 * @returns Query result with stock price data
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, refetch } = useStockPrice('AAPL');
 * ```
 */
export function useStockPrice(
  ticker: string,
  options: UseStockPriceOptions = {}
): UseQueryResult<StockPriceData, Error> {
  return useQuery({
    queryKey: QueryKeys.stockPrice(ticker),
    queryFn: () => apiService.getStockPrice(ticker),

    // Cache configuration - short stale time for price data
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes

    // Refetch strategy - only when user returns to tab
    refetchOnWindowFocus: true, // Smart refetching
    refetchInterval: false, // No polling - use manual refresh button

    // Only fetch if ticker is provided
    enabled: options.enabled !== false && !!ticker,

    // Keep previous data while fetching (stale-while-revalidate)
    placeholderData: (previousData) => previousData,
  });
}
