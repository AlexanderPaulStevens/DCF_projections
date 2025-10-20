/**
 * Simplified API Service - Thin Axios Wrapper
 * All caching and deduplication handled by React Query
 */

import axios, { AxiosError } from "axios";
import type {
  CompanyInfo,
  StockPriceData,
  StockData,
  FinancialRatios,
  DCFAnalysis,
  AnnualEBITData,
  AnalystRecommendation,
  CompanySearchResult,
  FCFPerShareData,
} from "../types/api";

// ============================================================================
// Base API Configuration
// ============================================================================

const getApiBaseUrl = (): string => {
  // Check if we're running in production (App Engine)
  const isProduction = process.env.NODE_ENV === "production";
  const isAppEngine =
    window.location.hostname.includes("appspot.com") ||
    window.location.hostname.includes("googleusercontent.com");

  if (isProduction || isAppEngine) {
    // In production, use the Cloud Run backend URL
    const productionApiUrl =
      process.env.REACT_APP_PRODUCTION_API_URL ||
      "https://dcf-backend-355089933221.europe-west1.run.app";
    console.log("🚀 Using production API URL:", productionApiUrl);
    return productionApiUrl;
  } else {
    // When running locally, use the local network API from config
    const apiHost = process.env.REACT_APP_API_HOST || "localhost";
    const apiPort = process.env.REACT_APP_API_PORT || "8001";
    const localApiUrl = `http://${apiHost}:${apiPort}`;
    console.log("🏠 Using local API URL:", localApiUrl);
    return localApiUrl;
  }
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================================================
// Global Response Interceptor - Centralized Error Handling
// ============================================================================

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle specific error codes
    if (error.response?.status === 404) {
      throw new Error("Resource not found");
    }
    if (error.response?.status === 500) {
      throw new Error("Server error - please try again later");
    }
    if (error.response?.status === 429) {
      throw new Error("Too many requests - please slow down");
    }
    if (error.code === "ECONNABORTED") {
      throw new Error("Request timeout - please try again");
    }
    // Re-throw the error for React Query to handle
    throw error;
  }
);

// ============================================================================
// API Service - Clean, Simple Methods
// ============================================================================

export const apiService = {
  // ------------------------------------------------------------------------
  // Stock Price Data
  // ------------------------------------------------------------------------

  async getStockPrice(ticker: string): Promise<StockPriceData> {
    const { data } = await api.get(`/companies/${ticker}/stock-price`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Company Information
  // ------------------------------------------------------------------------

  async getCompanyInfo(ticker: string): Promise<CompanyInfo> {
    const { data } = await api.get(`/companies/${ticker}/company-info`);
    return data;
  },

  async getStockData(ticker: string): Promise<StockData> {
    const { data } = await api.get(`/companies/${ticker}/raw-data`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Financial Ratios
  // ------------------------------------------------------------------------

  async getFinancialRatios(ticker: string): Promise<FinancialRatios> {
    const { data } = await api.get(`/companies/${ticker}/financial-ratios`);

    if (!data) {
      throw new Error("No financial ratios data available");
    }

    // Return the data as-is since backend now provides the correct structure
    return data;
  },

  // ------------------------------------------------------------------------
  // DCF Analysis
  // ------------------------------------------------------------------------

  async getDCFAnalysis(ticker: string): Promise<DCFAnalysis> {
    const { data } = await api.get(`/companies/${ticker}/DCF`);
    return data;
  },

  // ------------------------------------------------------------------------
  // EBIT Data
  // ------------------------------------------------------------------------

  async getAnnualEBIT(ticker: string): Promise<AnnualEBITData> {
    const { data } = await api.get(`/edgar/ebit/${ticker}`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Analyst Recommendation
  // ------------------------------------------------------------------------

  async getAnalystRecommendation(ticker: string): Promise<AnalystRecommendation> {
    const { data } = await api.get(`/companies/${ticker}/analyst-recommendation`);
    return data;
  },

  // ------------------------------------------------------------------------
  // FCF Per Share
  // ------------------------------------------------------------------------

  async getFCFPerShare(ticker: string): Promise<FCFPerShareData> {
    const { data } = await api.get(`/companies/${ticker}/fcf-per-share`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Historical Data
  // ------------------------------------------------------------------------

  async getHistoricalData(ticker: string, period: string = "6mo"): Promise<any> {
    const { data } = await api.get(`/companies/${ticker}/historical-data?period=${period}`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Risk Assessment
  // ------------------------------------------------------------------------

  async getRiskAssessment(ticker: string): Promise<any> {
    const { data } = await api.get(`/companies/${ticker}/risk-assessment`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Growth Opportunities
  // ------------------------------------------------------------------------

  async getGrowthOpportunities(ticker: string): Promise<any> {
    const { data } = await api.get(`/companies/${ticker}/opportunities`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Stock Forecast
  // ------------------------------------------------------------------------

  async getStockForecast(ticker: string): Promise<any> {
    const { data } = await api.get(`/companies/${ticker}/forecast`);
    return data;
  },

  // ------------------------------------------------------------------------
  // Company Search
  // ------------------------------------------------------------------------

  async searchCompanies(query: string): Promise<CompanySearchResult[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchTerm = query.toLowerCase().trim();

      // Get cached companies list (fast)
      const companies = await companiesListCache.getCompaniesList();

      // Filter companies by NAME ONLY (case-insensitive)
      const filteredCompanies = companies.filter((company) =>
        company.name.toLowerCase().includes(searchTerm)
      );

      // Sort results: prioritize matches at the start of the name
      filteredCompanies.sort((a, b) => {
        const aNameStarts = a.name.toLowerCase().startsWith(searchTerm);
        const bNameStarts = b.name.toLowerCase().startsWith(searchTerm);

        // Prioritize name matches that start with search term
        if (aNameStarts && !bNameStarts) return -1;
        if (!aNameStarts && bNameStarts) return 1;

        // Sort alphabetically by name
        return a.name.localeCompare(b.name);
      });

      return filteredCompanies;
    } catch (error) {
      console.error("❌ Error searching companies:", error);
      throw error;
    }
  },
};

// ============================================================================
// Companies List Cache - Module-level cache for static data
// ============================================================================

const companiesListCache = {
  cache: null as CompanySearchResult[] | null,
  cachePromise: null as Promise<CompanySearchResult[]> | null,

  async getCompaniesList(): Promise<CompanySearchResult[]> {
    // Return cached data if available
    if (this.cache) {
      return this.cache;
    }

    // If a fetch is already in progress, wait for it
    if (this.cachePromise) {
      return this.cachePromise;
    }

    // Fetch and cache the companies list
    const fetchPromise = api
      .get<Record<string, { name: string }>>("/companies/list")
      .then((response) => {
        const companiesDict = response.data || {};

        // Transform dictionary to array format for search
        const companiesArray: CompanySearchResult[] = Object.entries(companiesDict).map(
          ([ticker, companyInfo]) => ({
            ticker,
            name: companyInfo.name
          })
        );

        this.cache = companiesArray;
        this.cachePromise = null;
        console.log(`✅ Loaded and cached ${companiesArray.length} companies`);
        return companiesArray;
      })
      .catch((error) => {
        this.cachePromise = null;
        console.error("❌ Failed to load companies list:", error);
        return [] as CompanySearchResult[];
      });

    this.cachePromise = fetchPromise;
    return fetchPromise;
  },
};

// ============================================================================
// Backward Compatibility - Export as APIService for legacy components
// ============================================================================

export const APIService = apiService;

// Export the API instance for advanced use cases
export { api };

// Re-export types for convenience
export type {
  StockPriceData,
  CompanyInfo,
  FinancialRatios,
  DCFAnalysis,
  AnnualEBITData,
  AnalystRecommendation,
  FCFPerShareData,
  ProfitabilityRatios,
  LeverageRatios,
  EfficiencyRatios,
  ValuationRatios,
  LiquidityRatios,
  StockData,
  CompanySearchResult,
} from "../types/api";
