/**
 * React Query hook for FCF Per Share data
 */

import { useQuery } from "@tanstack/react-query";
import { apiService } from "../../services/api";
import { QueryKeys } from "../../types/api";
import type { FCFPerShareData } from "../../types/api";

export function useFCFPerShare(ticker: string) {
  return useQuery<FCFPerShareData, Error>({
    queryKey: QueryKeys.fcfPerShare(ticker),
    queryFn: () => apiService.getFCFPerShare(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}
