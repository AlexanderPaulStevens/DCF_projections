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
}

export default api;
