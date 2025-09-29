// API Service for DCF Projections Frontend
import axios from 'axios';

// Base API configuration
const getApiBaseUrl = () => {
  // Check if we're running in production (App Engine)
  const isProduction = process.env.NODE_ENV === 'production';
  const isAppEngine = window.location.hostname.includes('appspot.com') ||
                      window.location.hostname.includes('googleusercontent.com');

  if (isProduction || isAppEngine) {
    // In production, use the Cloud Run backend URL
    const productionApiUrl = process.env.REACT_APP_PRODUCTION_API_URL ||
                            'https://dcf-backend-355089933221.europe-west1.run.app';
    console.log('🚀 Using production API URL:', productionApiUrl);
    return productionApiUrl;
  } else if (window.location.hostname.includes('ngrok')) {
    // When on ngrok, we need to get the API URL from the ngrok API
    // This will be set by the run.sh script or we'll try to detect it
    const ngrokApiUrl = process.env.REACT_APP_NGROK_API_URL;

    if (ngrokApiUrl) {
      console.log('🔍 Using ngrok API URL from env:', ngrokApiUrl);
      return ngrokApiUrl;
    } else {
      // Try to detect the API URL automatically
      console.log('🔍 Attempting to auto-detect ngrok API URL...');
      // For now, use the known API URL from the terminal output
      const detectedApiUrl = process.env.REACT_APP_NGROK_API_URL || 'https://your-ngrok-url.ngrok-free.app';
      console.log('🔍 Using detected ngrok API URL:', detectedApiUrl);
      return detectedApiUrl;
    }
  } else {
    // When running locally, use the local network API from config
    const apiHost = process.env.REACT_APP_API_HOST || 'localhost';
    const apiPort = process.env.REACT_APP_API_PORT || '8000';
    const localApiUrl = `http://${apiHost}:${apiPort}`;
    console.log('🏠 Using local API URL:', localApiUrl);
    return localApiUrl;
  }
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to fetch ngrok API URL
const fetchNgrokApiUrl = async (): Promise<string | null> => {
  try {
    const port = process.env.REACT_APP_NGROK_PORT || '4040';
    const response = await fetch(`http://localhost:${port}/api/tunnels`);
    const data = await response.json();

    if (data.tunnels && data.tunnels.length > 0) {
      const apiTunnel = data.tunnels?.find((tunnel: any) =>
        tunnel.config?.addr === 'http://localhost:8000'
      );
      return apiTunnel?.public_url || null;
    }
  } catch (error) {
    console.error('Failed to fetch ngrok API URL:', error);
  }
  return null;
};

// API Service class
export class APIService {
  static async getComprehensiveAnalysis(ticker: string): Promise<ComprehensiveAnalysis> {
    try {
      const response = await api.get(`/companies/${ticker}/analysis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comprehensive analysis:', error);
      throw error;
    }
  }

  static async getStockData(ticker: string): Promise<StockData> {
    try {
      const response = await api.get(`/companies/${ticker}/stock-data`);
      return response.data;
    } catch (error) {
      console.error('Error fetching stock data:', error);
      throw error;
    }
  }

  static async getHistoricalData(ticker: string, period: string, showForecast: boolean = false): Promise<HistoricalData> {
    try {
      const response = await api.get(`/companies/${ticker}/historical-data`, {
        params: { period, show_forecast: showForecast }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching historical data:', error);
      throw error;
    }
  }

  static async getForecastAnalysis(ticker: string): Promise<ForecastAnalysis> {
    try {
      const response = await api.get(`/companies/${ticker}/forecast`);
      return response.data;
    } catch (error) {
      console.error('Error fetching forecast analysis:', error);
      throw error;
    }
  }

  static async getFinancialRatios(ticker: string): Promise<FinancialRatios> {
    try {
      const response = await api.get(`/companies/${ticker}/ratios`);
      return response.data;
    } catch (error) {
      console.error('Error fetching financial ratios:', error);
      throw error;
    }
  }

  static async getDCFAnalysis(ticker: string): Promise<DCFAnalysis> {
    try {
      const response = await api.get(`/companies/${ticker}/dcf`);
      return response.data;
    } catch (error) {
      console.error('Error fetching DCF analysis:', error);
      throw error;
    }
  }

  static async getSensitivityAnalysis(ticker: string): Promise<SensitivityAnalysis> {
    try {
      const response = await api.get(`/companies/${ticker}/sensitivity`);
      return response.data;
    } catch (error) {
      console.error('Error fetching sensitivity analysis:', error);
      throw error;
    }
  }

  static async getBusinessStrategyAnalysis(ticker: string): Promise<BusinessStrategyAnalysis> {
    try {
      const response = await api.get(`/companies/${ticker}/business-strategy`);
      return response.data;
    } catch (error) {
      console.error('Error fetching business strategy analysis:', error);
      throw error;
    }
  }

  static async getCompetitiveAnalysis(ticker: string): Promise<CompetitiveAnalysis> {
    try {
      const response = await api.get(`/companies/${ticker}/competitive-analysis`);
      return response.data;
    } catch (error) {
      console.error('Error fetching competitive analysis:', error);
      throw error;
    }
  }

  static async getTechnicalAnalysis(ticker: string, request: TechnicalAnalysisRequest): Promise<TechnicalAnalysisResponse> {
    try {
      const response = await api.post(`/companies/${ticker}/technical-analysis`, request);
      return response.data;
    } catch (error) {
      console.error('Error fetching technical analysis:', error);
      throw error;
    }
  }
}

// Type definitions
export interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  pe: number;
  eps: number;
  dividend: number;
  yield: number;
  high52Week: number;
  low52Week: number;
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

export interface ComprehensiveAnalysis {
  ticker: string;
  company_name: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  market_cap: number;
  volume: number;
  analysis_date: string;
  confidence_score: number;
  sector: string;
  industry: string;
  data_sources: string[];
  competitive: {
    market_position: string;
    competitive_strength: string;
    market_share: string;
    brand_strength: string;
    pricing_power: string;
    customer_loyalty: string;
    barriers_to_entry: string;
    switching_costs: string;
    network_effects: string;
    economies_of_scale: string;
    regulatory_advantages: string;
    intellectual_property: string;
    distribution_advantages: string;
    cost_advantages: string;
    innovation_capability: string;
    management_quality: string;
    financial_strength: string;
    operational_efficiency: string;
    moat_level: string;
    overall_moat_score: number;
    top_advantage: string;
    weakest_area: string;
    ecosystem_score: number;
    brand_score: number;
    integration_score: number;
    supply_chain_score: number;
    strategic_score: number;
  };
  competitive_advantage: {
    advantages: Array<{
      type: string;
      description: string;
      strength: number;
      category: string;
    }>;
    overall_score: number;
    key_strengths: string[];
    potential_weaknesses: string[];
    overall_moat_strength: {
      score: number;
      description: string;
      level: string;
    };
    competitive_advantages: Array<{
      category: string;
      description: string;
      strength: number;
      strength_score: number;
      evidence: string[];
      sustainability: string;
      impact_on_valuation: string;
    }>;
    investment_thesis: {
      thesis: string;
      recommendation: string;
      risk_factors: string[];
      opportunities: string[];
    };
    porters_five_forces: {
      threat_of_new_entrants: string;
      bargaining_power_of_suppliers: string;
      bargaining_power_of_buyers: string;
      threat_of_substitute_products: string;
      competitive_rivalry: string;
      overall_industry_attractiveness: number;
      supplier_power: number;
      buyer_power: number;
      rivalry_level: number;
    };
    sector_insights: {
      recommendations: string[];
    };
  };
  summary: {
    dcf_value: number;
    moat_strength_score: number;
    investment_recommendation: string;
    risk_level: string;
    upside_potential: number;
    moat_level: string;
    industry_attractiveness: number;
  };
  valuation: {
    dcf_per_share: number;
    current_price: number;
    upside_downside: number;
    market_cap: number;
    enterprise_value: number;
    pe_ratio: number;
    pb_ratio: number;
    price_target: number;
  };
  opportunities: {
    growth_opportunities: string[];
    strategic_advantages: string[];
    market_expansion_potential: string;
    innovation_capability: string;
  };
  risks: {
    competitive_risks: string[];
    industry_risks: string[];
    financial_risks: string[];
    overall_risk_level: string;
    risk_factors_count: number;
  };
  overview: CompanyOverview;
  financialRatios: FinancialRatios;
  dcfAnalysis: DCFAnalysis;
  sensitivityAnalysis: SensitivityAnalysis;
  forecastAnalysis: ForecastAnalysis;
  competitiveAnalysis: CompetitiveAnalysis;
  businessStrategyAnalysis: BusinessStrategyAnalysis;
  stockData: StockData;
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

export interface FinancialRatios {
  ticker: string;
  ratios: {
    profitability: {
      roe: number;
      roa: number;
      roic: number;
      grossMargin: number;
      operatingMargin: number;
      netMargin: number;
    };
    liquidity: {
      currentRatio: number;
      quickRatio: number;
      cashRatio: number;
    };
    leverage: {
      debtToEquity: number;
      debtToAssets: number;
      interestCoverage: number;
    };
    efficiency: {
      assetTurnover: number;
      inventoryTurnover: number;
      receivablesTurnover: number;
    };
    valuation: {
      pe: number;
      pb: number;
      ps: number;
      evEbitda: number;
      peg: number;
    };
  };
  profitability: {
    roe: number;
    roa: number;
    roic: number;
    grossMargin: number;
    operatingMargin: number;
    netMargin: number;
  };
  liquidity: {
    currentRatio: number;
    quickRatio: number;
    cashRatio: number;
  };
  leverage: {
    debtToEquity: number;
    debtToAssets: number;
    interestCoverage: number;
  };
  efficiency: {
    assetTurnover: number;
    inventoryTurnover: number;
    receivablesTurnover: number;
  };
  valuation: {
    pe: number;
    pb: number;
    ps: number;
    evEbitda: number;
    peg: number;
  };
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
}

export interface SensitivityAnalysis {
  ticker: string;
  scenarios: Array<{
    name: string;
    wacc: number;
    terminalGrowthRate: number;
    intrinsicValue: number;
    upside: number;
  }>;
  baseCase: {
    wacc: number;
    terminalGrowthRate: number;
    intrinsicValue: number;
    upside: number;
  };
}

export interface ForecastAnalysis {
  ticker: string;
  current_price: number;
  forecast_price: number;
  forecast_trend: number;
  confidence_lower: number;
  confidence_upper: number;
  forecasts: Array<{
    metric: string;
    current: number;
    forecast1Y: number;
    forecast2Y: number;
    forecast3Y: number;
    growthRate: number;
  }>;
  confidence: number;
  methodology: string;
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

export interface BusinessStrategyAnalysis {
  ticker: string;
  strategy: {
    description: string;
    focus: string;
    differentiation: string;
  };
  insights: Array<{
    category: string;
    insight: string;
    impact: string;
  }>;
  recommendations: Array<{
    area: string;
    recommendation: string;
    priority: string;
  }>;
  business_model_analysis: {
    model_type: string;
    revenue_streams: string[];
    key_partners: string[];
    value_proposition: string;
    customer_segments: string[];
    cost_structure: string[];
    competitive_advantages: string[];
  };
  strategy_insights: string[];
  survival_metrics: {
    market_position: string;
    financial_stability: string;
    operational_efficiency: string;
    innovation_capability: string;
    customer_satisfaction: string;
    employee_retention: string;
    regulatory_compliance: string;
    technology_adoption: string;
  };
}

export interface StrategyInsight {
  category: string;
  insight: string;
  impact: string;
}

export interface TechnicalAnalysisRequest {
  indicators: string[];
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
    series: Array<{
      id: string;
      label: string;
      color: string;
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
  comparison: Array<{
    date: string;
    value: number;
    series: Array<{
      id: string;
      label: string;
      color: string;
    }>;
  }>;
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
