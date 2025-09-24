import axios from 'axios';

// Smart API configuration that detects ngrok usage
const getApiBaseUrl = () => {
  // Check if we're running on ngrok
  const isNgrok = window.location.hostname.includes('ngrok');

  if (isNgrok) {
    // When on ngrok, we need to check if the API is accessible
    // First, try to use the same ngrok domain but different port
    const ngrokDomain = window.location.hostname;
    const ngrokApiUrl = `https://${ngrokDomain.replace('3000', '8000')}`;

    console.log('🔍 Detected ngrok, trying API URL:', ngrokApiUrl);
    return ngrokApiUrl;
  } else {
    // When running locally, use the local network API
    const localApiUrl = 'http://192.168.0.115:8000';
    console.log('🏠 Using local API URL:', localApiUrl);
    return localApiUrl;
  }
};

// Try to load configuration from central config file
try {
  // This will be replaced by build-time configuration
  const configPath = process.env.REACT_APP_CONFIG_PATH || '../../config.env';
  console.log('🔧 Loading config from:', configPath);
} catch (error) {
  console.log('⚠️ Using default configuration');
}

const API_BASE_URL = getApiBaseUrl();

// Log the API URL being used (helpful for debugging)
console.log('🌐 API Base URL:', API_BASE_URL);
console.log('📍 Current Hostname:', window.location.hostname);
console.log('🔌 Is Ngrok:', window.location.hostname.includes('ngrok'));

// Test API connection immediately
console.log('🧪 Testing API connection...');
fetch(`${API_BASE_URL}/health`)
  .then(response => response.json())
  .then(data => console.log('✅ API Health Check:', data))
  .catch(error => console.error('❌ API Health Check Failed:', error));

// Configuration utility
export const APIConfig = {
  getBaseURL: () => API_BASE_URL,
  getCurrentIP: () => {
    const url = new URL(API_BASE_URL);
    return url.hostname;
  },
  getCurrentPort: () => {
    const url = new URL(API_BASE_URL);
    return url.port;
  },
  // Helper to check if API is accessible
  async checkConnection() {
    try {
      const response = await api.get('/health');
      return { connected: true, url: API_BASE_URL, response: response.data };
    } catch (error) {
      return { connected: false, url: API_BASE_URL, error: error instanceof Error ? error.message : String(error) };
    }
  }
};

// Create axios instance with retry logic for ngrok
const createApiInstance = (baseURL: string) => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// Create the main API instance
const api = createApiInstance(API_BASE_URL);

// Add response interceptor to handle ngrok API failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If we're on ngrok and the API call failed, try alternative URLs
    if (window.location.hostname.includes('ngrok') && error.response?.status >= 400) {
      console.log('⚠️ API call failed on ngrok, trying alternative URLs...');

      // Try alternative API URLs
      const alternatives = [
        'http://192.168.0.115:8000',  // Local network
        'http://localhost:8000',       // Localhost
        'https://a06a67f397a2.ngrok-free.app:8000'  // Explicit ngrok API
      ];

      for (const altUrl of alternatives) {
        try {
          console.log(`🔄 Trying alternative API URL: ${altUrl}`);
          const altApi = createApiInstance(altUrl);
          const response = await altApi.get('/health');
          console.log(`✅ Alternative API working: ${altUrl}`);

          // Update the main API instance
          api.defaults.baseURL = altUrl;
          return response;
        } catch (altError) {
          console.log(`❌ Alternative API failed: ${altUrl}`);
          continue;
        }
      }
    }

    return Promise.reject(error);
  }
);

// API response types
export interface Company {
  ticker: string;
  name: string;
  sector?: string;
}

export interface CompanyOverview {
  ticker: string;
  overview: Record<string, any>;
  financial_data?: Record<string, any>;
}

export interface FinancialRatios {
  ticker: string;
  ratios: Record<string, any>;
  raw_data: Record<string, any>;
}

export interface DCFAnalysis {
  ticker: string;
  base_results: Record<string, any>;
  scenarios: Array<{
    growth_rate: number;
    enterprise_value: number;
    equity_value: number;
    per_share_value: number;
  }>;
  parameters: Record<string, any>;
}

export interface SensitivityAnalysis {
  ticker: string;
  variable: string;
  base_value: number;
  steps: Array<Record<string, any>>;
}

export interface ForecastAnalysis {
  ticker: string;
  current_price: number;
  forecast_price: number;
  forecast_trend: number;
  confidence_lower: number;
  confidence_upper: number;
  forecast_dates: string[];
  forecast_values: number[];
}

export interface StockData {
  ticker: string;
  name: string;
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
  currency: string;
  exchange: string;
  sector: string;
  industry: string;
  website: string;
  description: string;
  employees: number;
  city: string;
  state: string;
  country: string;
  price_change: number;
  price_change_percent: number;
  last_updated: string;
}

export interface HistoricalData {
  ticker: string;
  period: string;
  data: Array<{
    Date: string;
    Open: number;
    High: number;
    Low: number;
    Close: number;
    Volume: number;
  }>;
  forecast?: {
    forecast_dates: string[];
    forecast_values: number[];
    confidence_lower: number;
    confidence_upper: number;
    current_price: number;
    forecast_price: number;
    forecast_trend: number;
  };
  forecast_error?: string;
}

export interface CompetitorData {
  ticker: string;
  name: string;
  market_cap: number;
  sector: string;
  industry: string;
  pe_ratio?: number;
  revenue?: number;
  profit_margin?: number;
  roe?: number;
  debt_to_equity?: number;
  current_ratio?: number;
  revenue_growth?: number;
  earnings_growth?: number;
}

export interface CompetitiveAnalysis {
  target_company: {
    ticker: string;
    name: string;
    sector: string;
    industry: string;
  };
  competitors: CompetitorData[];
  comparison_metrics: {
    market_cap_rank?: number;
    market_cap_percentile?: number;
    pe_ratio_rank?: number;
    pe_ratio_percentile?: number;
    profit_margin_rank?: number;
    profit_margin_percentile?: number;
    roe_rank?: number;
    roe_percentile?: number;
    revenue_growth_rank?: number;
    revenue_growth_percentile?: number;
    competitive_position_score: number;
  };
  insights: {
    competitive_position: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
    recommendations: string[];
  };
  analysis_date: string;
}

export interface StrategyInsight {
  category: string;
  insight: string;
  confidence: number;
  source: string;
}

export interface SurvivalMetrics {
  altman_z_score?: number;
  current_ratio?: number;
  debt_to_equity?: number;
  interest_coverage?: number;
  cash_ratio?: number;
  survival_probability: number;
  risk_level: string;
}

export interface BusinessStrategyAnalysis {
  ticker: string;
  strategy_insights: StrategyInsight[];
  business_model_analysis: {
    revenue_diversification: number;
    profitability_trends: number;
    market_position: number;
    innovation_level: number;
    sustainability_score: number;
  };
  survival_metrics: SurvivalMetrics;
  recommendations: string[];
  analysis_date: string;
}

// API service class
export class APIService {
  // Health check
  static async healthCheck() {
    const response = await api.get('/health');
    return response.data;
  }

  // Search companies
  static async searchCompanies(query: string): Promise<Company[]> {
    const response = await api.get(`/api/companies/search?query=${encodeURIComponent(query)}`);
    return response.data;
  }

  // Get company list
  static async getCompanyList(limit: number = 50): Promise<Company[]> {
    const response = await api.get(`/api/companies/list?limit=${limit}`);
    return response.data;
  }

  // Get company overview
  static async getCompanyOverview(ticker: string): Promise<CompanyOverview> {
    const response = await api.get(`/api/companies/${ticker}/overview`);
    return response.data;
  }

  // Get financial ratios
  static async getFinancialRatios(ticker: string): Promise<FinancialRatios> {
    const response = await api.get(`/api/companies/${ticker}/ratios`);
    return response.data;
  }

  // Get DCF analysis
  static async getDCFAnalysis(
    ticker: string,
    earningsGrowth: number = 0.15,
    years: number = 5,
    steps: number = 0,
    stepSize: number = 0.10
  ): Promise<DCFAnalysis> {
    // The backend DCF endpoint doesn't accept query parameters, so we call it directly
    const response = await api.get(`/api/companies/${ticker}/dcf`);
    return response.data;
  }

  // Get sensitivity analysis
  static async getSensitivityAnalysis(ticker: string, steps: number = 11): Promise<SensitivityAnalysis> {
    const response = await api.get(`/api/companies/${ticker}/sensitivity`, {
      params: { steps },
    });
    return response.data;
  }

  // Get company financials
  static async getCompanyFinancials(ticker: string) {
    const response = await api.get(`/api/companies/${ticker}/financials`);
    return response.data;
  }

  // Get forecast analysis
  static async getForecastAnalysis(ticker: string): Promise<ForecastAnalysis> {
    const response = await api.get(`/api/companies/${ticker}/forecast`);
    return response.data;
  }

  // Get real-time stock data
  static async getStockData(ticker: string): Promise<StockData> {
    const response = await api.get(`/api/companies/${ticker}/stock-data`);
    return response.data;
  }

  // Get historical stock data
  static async getHistoricalData(ticker: string, period: string = '1y', includeForecast: boolean = false): Promise<HistoricalData> {
    console.log('🌐 API call: getHistoricalData', { ticker, period, includeForecast });
    const response = await api.get(`/api/companies/${ticker}/historical-data?period=${period}&include_forecast=${includeForecast}`);
    console.log('📊 API response:', response.data);
    return response.data;
  }

  // Get competitive analysis
  static async getCompetitiveAnalysis(ticker: string, maxCompetitors: number = 5): Promise<CompetitiveAnalysis> {
    const response = await api.get(`/api/companies/${ticker}/competitive-analysis?max_competitors=${maxCompetitors}`);
    return response.data;
  }

  // Get business strategy analysis
  static async getBusinessStrategyAnalysis(ticker: string): Promise<BusinessStrategyAnalysis> {
    const response = await api.get(`/api/companies/${ticker}/business-strategy`);
    return response.data;
  }
}

export default api;
