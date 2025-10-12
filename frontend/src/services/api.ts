// API Service for DCF Projections Frontend
import axios from "axios";

// Base API configuration
const getApiBaseUrl = () => {
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
  } else if (window.location.hostname.includes("ngrok")) {
    // When on ngrok, we need to get the API URL from the ngrok API
    // This will be set by the run.sh script or we'll try to detect it
    const ngrokApiUrl = process.env.REACT_APP_NGROK_API_URL;

    if (ngrokApiUrl) {
      console.log("🔍 Using ngrok API URL from env:", ngrokApiUrl);
      return ngrokApiUrl;
    } else {
      // Try to detect the API URL automatically
      console.log("🔍 Attempting to auto-detect ngrok API URL...");
      // For now, use the known API URL from the terminal output
      const detectedApiUrl =
        process.env.REACT_APP_NGROK_API_URL ||
        "https://your-ngrok-url.ngrok-free.app";
      console.log("🔍 Using detected ngrok API URL:", detectedApiUrl);
      return detectedApiUrl;
    }
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

// API Service class
export class APIService {
  static async getCompanyInfo(ticker: string): Promise<CompanyInfo> {
    try {
      const response = await api.get(`/companies/${ticker}/company-info`);
      return response.data;
    } catch (error) {
      console.error("Error fetching company info:", error);
      throw error;
    }
  }

  static async getStockData(ticker: string): Promise<StockData> {
    try {
      const response = await api.get(`/companies/${ticker}/stock-data`);
      return response.data;
    } catch (error) {
      console.error("Error fetching stock data:", error);
      throw error;
    }
  }

  static async getFinancialRatios(ticker: string): Promise<FinancialRatios> {
    try {
      const response = await api.get(`/companies/${ticker}/financial-ratios`);
      return response.data;
    } catch (error) {
      console.error("Error fetching financial ratios:", error);
      throw error;
    }
  }

  static async getDCFAnalysis(ticker: string): Promise<DCFAnalysis> {
    try {
      const response = await api.get(`/companies/${ticker}/DCF`);
      return response.data;
    } catch (error) {
      console.error("Error fetching DCF analysis:", error);
      throw error;
    }
  }

  static async getAnalystRecommendation(
    ticker: string,
  ): Promise<AnalystRecommendation> {
    try {
      const response = await api.get(
        `/companies/${ticker}/analyst-recommendation`,
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching analyst recommendation:", error);
      throw error;
    }
  }

  static async getHistoricalData(
    ticker: string,
    period: string = "6mo",
  ): Promise<any> {
    try {
      const response = await api.get(
        `/companies/${ticker}/stock-data?period=${period}`,
      );
      return {
        ticker: response.data.ticker,
        period: response.data.period,
        data: response.data.historical_data || [],
        count: response.data.historical_data?.length || 0,
      };
    } catch (error) {
      console.error("Error fetching historical data:", error);
      throw error;
    }
  }

  static async getRiskAssessment(ticker: string): Promise<any> {
    try {
      const response = await api.get(`/companies/${ticker}/risk-assessment`);
      return response.data;
    } catch (error) {
      console.error("Error fetching risk assessment:", error);
      throw error;
    }
  }

  static async getGrowthOpportunities(ticker: string): Promise<any> {
    try {
      const response = await api.get(`/companies/${ticker}/opportunities`);
      return response.data;
    } catch (error) {
      console.error("Error fetching growth opportunities:", error);
      throw error;
    }
  }

  static async getStockForecast(ticker: string): Promise<any> {
    try {
      const response = await api.get(`/companies/${ticker}/forecast`);
      return response.data;
    } catch (error) {
      console.error("Error fetching stock forecast:", error);
      throw error;
    }
  }

  static async getAnnualEBIT(ticker: string): Promise<AnnualEBITData> {
    try {
      const response = await api.get(`/edgar/ebit/${ticker}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching annual EBIT:", error);
      throw error;
    }
  }

  // Cache for companies list to avoid repeated API calls
  private static companiesCache: any[] | null = null;
  private static companiesCachePromise: Promise<any[]> | null = null;

  private static async getCompaniesList(): Promise<any[]> {
    // Return cached data if available
    if (this.companiesCache) {
      return this.companiesCache;
    }

    // If a fetch is already in progress, wait for it
    if (this.companiesCachePromise) {
      return this.companiesCachePromise;
    }

    // Fetch and cache the companies list
    const fetchPromise: Promise<any[]> = api
      .get("/companies/list")
      .then((response) => {
        const data = response.data || [];
        this.companiesCache = data;
        this.companiesCachePromise = null;
        console.log(`Loaded and cached ${data.length} companies`);
        return data;
      })
      .catch((error) => {
        this.companiesCachePromise = null;
        console.error("Failed to load companies list:", error);
        return [] as any[];
      });

    this.companiesCachePromise = fetchPromise;
    return fetchPromise;
  }

  static async searchCompanies(query: string): Promise<any[]> {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      const searchTerm = query.toLowerCase().trim();

      // Get cached companies list (fast)
      const companies = await this.getCompaniesList();

      // Filter companies by NAME ONLY (case-insensitive)
      const filteredCompanies = companies.filter((company: any) =>
        company.name.toLowerCase().includes(searchTerm),
      );

      // Sort results: prioritize matches at the start of the name
      filteredCompanies.sort((a: any, b: any) => {
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
      console.error("Error searching companies:", error);
      throw error;
    }
  }
}

// Type definitions
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
  headquarters?: string;
  business_summary?: string;
  last_updated: string;
}

export interface StockData {
  ticker: string;
  current_price: number;
  previous_close: number;
  open: number;
  day_low: number;
  day_high: number;
  fifty_two_week_low: number;
  fifty_two_week_high: number;
  volume: number;
  avg_volume: number;
  market_cap: number;
  beta: number;
  pe_ratio: number;
  forward_pe: number;
  eps: number;
  forward_eps: number;
  dividend_yield: number;
  ex_dividend_date?: string;
  earnings_date?: string;
  target_price: number;
  recommendation: string;
  price_change: number;
  price_change_percent: number;
  last_updated: string;
}

export interface HistoricalData {
  symbol: string;
  data: Array<{
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;
  forecast?: Array<{
    date: string;
    close: number;
    confidence: number;
  }>;
}

export interface CompanyOverview {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  description: string;
  website: string;
  employees: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividend: number;
  yield: number;
}

export interface RatioEvaluationData {
  value: number | null;
  evaluation: "good" | "poor" | "unknown";
  color: "success" | "error" | "default";
  icon: "trending_up" | "trending_down" | "trending_flat";
}

export interface FinancialRatios {
  ticker: string;
  ratios: {
    profitability?: {
      ROE?: RatioEvaluationData;
      ROA?: RatioEvaluationData;
      ROIC?: RatioEvaluationData;
      operating_margin?: RatioEvaluationData;
      net_margin?: RatioEvaluationData;
      revenue_growth_ebit?: RatioEvaluationData;
      operating_income_growth?: RatioEvaluationData;
      earnings_quality_ratio?: RatioEvaluationData; // FCF/net income
    };
    leverage?: {
      debt_to_equity?: RatioEvaluationData;
      debt_to_assets?: RatioEvaluationData;
      debt_to_free_cash_ratio?: RatioEvaluationData;
      interest_coverage_ratio?: RatioEvaluationData;
    };
    efficiency?: {
      asset_turnover?: RatioEvaluationData;
    };
    valuation?: {
      pe_ratio?: RatioEvaluationData;
      pb_ratio?: RatioEvaluationData;
      ps_ratio?: RatioEvaluationData;
      peg_ratio?: RatioEvaluationData;
    };
  };
}

export interface ValuationAnalysis {
  ticker: string;
  ratios?: {
    pe_ratio?: number;
    pb_ratio?: number;
    ps_ratio?: number;
    peg_ratio?: number;
  };
  dcf_analysis?: any;
  forecasts?: any;
  analysis_warning?: string;
  cache_status?: string;
  cache_warning?: boolean;
}

export interface DCFAnalysis {
  ticker: string;
  intrinsicValue: number;
  currentPrice: number;
  upside: number;
  assumptions: {
    wacc: number;
    terminalGrowthRate: number;
    projectionYears: number;
  };
  cashFlows: Array<{
    year: number;
    freeCashFlow: number;
    presentValue: number;
  }>;
  terminalValue: number;
  enterpriseValue: number;
  equityValue: number;
  sharesOutstanding: number;
  base_results: {
    [key: string]: any;
  };
  cache_status?: string;
  cache_warning?: boolean;
  analysis_warning?: string;
  scraping_status?: string;
}

export interface CompetitiveAnalysis {
  ticker: string;
  competitors: Array<{
    ticker: string;
    name: string;
    marketCap: number;
    pe: number;
    revenue: number;
    margin: number;
  }>;
  marketPosition: {
    rank: number;
    totalCompetitors: number;
    marketShare: number;
  };
  advantages: Array<{
    type: string;
    description: string;
    strength: number;
  }>;
  risks: Array<{
    type: string;
    description: string;
    impact: number;
  }>;
}

export interface TechnicalAnalysisRequest {
  indicators: Array<{
    name: string;
    params: { [key: string]: any };
    display: string;
  }>;
  period: string;
  interval: string;
  chart_type: string;
  include_volume: boolean;
  comparison_ticker: string | null;
}

export interface TechnicalAnalysisResponse {
  ticker: string;
  indicators: Array<{
    name: string;
    value: number;
    signal: string;
    description: string;
    id: string;
    label: string;
    display: string;
    color?: string;
    series: Array<{
      id: string;
      label: string;
      color: string;
      name: string;
      values: number[];
    }>;
  }>;
  summary: {
    overall: string;
    trend: string;
    strength: number;
  };
  meta: {
    period: string;
    interval: string;
    last_updated: string;
    active_config: {
      period: string;
      interval: string;
      indicators: Array<{
        name: string;
        params: { [key: string]: any };
        display: string;
      }>;
      chart_type: string;
      include_volume: boolean;
      comparison_ticker: string | null;
    };
    available_indicators: string[];
    periods: string[];
    chart_types: string[];
  };
  price: Array<{
    date: string;
    value: number;
    close: number;
  }>;
  comparison: {
    label: string;
    series: Array<{
      date: string;
      value: number;
    }>;
  };
  patterns: Array<{
    name: string;
    label: string;
    occurrences: Array<{
      date: string;
      confidence: number;
      value: number;
    }>;
  }>;
}

export interface TechnicalIndicatorResult {
  name: string;
  value: number;
  signal: string;
  description: string;
  id: string;
  label: string;
  display: string;
  series: Array<{
    id: string;
    label: string;
    color: string;
  }>;
  metadata: {
    params: any;
    display: string;
  };
}

export interface TechnicalIndicatorDefinition {
  name: string;
  params: any;
  display: string;
  default_params: any;
  default_display: string;
  label: string;
  description: string;
  supports_overlay: boolean;
  supports_subchart: boolean;
}

export interface CompetitiveAdvantage {
  type: string;
  description: string;
  strength: number;
}

export interface MarketRisk {
  type: string;
  description: string;
  impact: number;
}

export interface AnalystRecommendation {
  ticker: string;
  recommendation: "STRONG_BUY" | "BUY" | "HOLD" | "SELL" | "STRONG_SELL";
  target_price: number;
  current_price: number;
  upside_potential: number;
  confidence_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  reasoning: string[];
  key_risks: string[];
  key_opportunities: string[];
  key_metrics: {
    current_price: number;
    intrinsic_value: number;
    price_to_intrinsic_ratio: number;
    pe_ratio: number;
    beta: number;
    market_cap: number;
    revenue_growth_rate: number;
    net_profit_margin: number;
    wacc: number;
  };
  dcf_intrinsic_value: number;
  price_to_intrinsic_ratio: number;
  analysis_timestamp: string;
  analyst_notes: string;
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
    total_years: number;
  };
}

// Note: Companies list is cached after first search for instant subsequent searches
