import { useQuery } from "@tanstack/react-query";
import { APIService } from "../../services/api";

export const useAnalystRecommendation = (ticker: string, enabled: boolean = false) => {
  return useQuery({
    queryKey: ["analystRecommendation", ticker],
    queryFn: () => APIService.getAnalystRecommendation(ticker),
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes - analyst recommendations don't change frequently
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 404 or 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry once on 5xx or network errors
      return failureCount < 1;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};
