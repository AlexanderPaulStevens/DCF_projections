/**
 * Centralized API Type Definitions
 * Single source of truth for all API-related types
 */

// ============================================================================
// Company Information
// ============================================================================

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

// ============================================================================
// Stock Price Data
// ============================================================================

export interface StockPriceData {
  ticker: string;
  current_price: number;
  previous_close: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  day_low: number;
  day_high: number;
  fifty_two_week_low: number;
  fifty_two_week_high: number;
  market_cap: number;
  pe_ratio: number;
  beta: number;
  last_updated: string;
  market_open: boolean;
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

// ============================================================================
// Financial Ratios
// ============================================================================

export interface ProfitabilityRatios {
  roe?: number | null;
  roa?: number | null;
  roic?: number | null;
  operating_margin?: number | null;
  net_margin?: number | null;
  gross_margin?: number | null;
  earnings_quality_ratio?: number | null;
}

export interface LeverageRatios {
  debt_to_equity?: number | null;
  debt_to_assets?: number | null;
  interest_coverage?: number | null;
  net_debt_to_ebitda?: number | null;
}

export interface EfficiencyRatios {
  asset_turnover?: number | null;
  inventory_turnover?: number | null;
  receivables_turnover?: number | null;
  working_capital_turnover?: number | null;
}

export interface ValuationRatios {
  pe_ratio?: number | null;
  forward_pe?: number | null;
  peg_ratio?: number | null;
  pb_ratio?: number | null;
  ps_ratio?: number | null;
  ev_to_ebitda?: number | null;
  price_to_fcf?: number | null;
}

export interface LiquidityRatios {
  current_ratio?: number | null;
  quick_ratio?: number | null;
  cash_ratio?: number | null;
}

export interface FinancialRatios {
  ticker: string;
  latest_year: number;
  years_available: number[];
  ratios: {
    [year: string]: {
      profitability?: ProfitabilityRatios;
      leverage?: LeverageRatios;
      efficiency?: EfficiencyRatios;
      valuation?: ValuationRatios;
      liquidity?: LiquidityRatios;
    };
  };
  analysis_warning?: string;
  cache_status?: string;
  cache_warning?: boolean;
}

// ============================================================================
// DCF Analysis
// ============================================================================

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

// ============================================================================
// EBIT Data
// ============================================================================

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

// ============================================================================
// Analyst Recommendation
// ============================================================================

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
    wacc: number;
  };
  dcf_intrinsic_value: number;
  price_to_intrinsic_ratio: number;
  analysis_timestamp: string;
  analyst_notes: string;
}

// ============================================================================
// Historical Data
// ============================================================================

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

// ============================================================================
// Company Search
// ============================================================================

export interface CompanySearchResult {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
}

// ============================================================================
// Technical Analysis
// ============================================================================

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

// ============================================================================
// Valuation Analysis
// ============================================================================

export interface ValuationAnalysis {
  ticker: string;
  ratios?: {
    profitability?: ProfitabilityRatios;
    leverage?: LeverageRatios;
    efficiency?: EfficiencyRatios;
    valuation?: ValuationRatios;
    liquidity?: LiquidityRatios;
  };
  dcf_analysis?: any;
  forecasts?: any;
  analysis_warning?: string;
  cache_status?: string;
  cache_warning?: boolean;
}

// ============================================================================
// FCF Per Share Data
// ============================================================================

export interface FCFPerShareData {
  ticker: string;
  free_cash_flow: number | null;  // Total FCF in millions
  shares_outstanding: number | null;  // Shares in millions
  fcf_per_share: number | null;  // FCF per share in dollars
  year: string | null;  // Fiscal year of the data
  cache_status?: string;
}

// ============================================================================
// Query Keys - Centralized for consistency
// ============================================================================

export const QueryKeys = {
  stockPrice: (ticker: string) => ['stock', ticker, 'price'] as const,
  companyInfo: (ticker: string) => ['company', ticker, 'info'] as const,
  financialRatios: (ticker: string) => ['company', ticker, 'ratios'] as const,
  dcfAnalysis: (ticker: string) => ['company', ticker, 'dcf'] as const,
  ebitData: (ticker: string) => ['company', ticker, 'ebit'] as const,
  analystRecommendation: (ticker: string) => ['company', ticker, 'analyst'] as const,
  fcfPerShare: (ticker: string) => ['company', ticker, 'fcf-per-share'] as const,
  historicalData: (ticker: string, period: string) => ['stock', ticker, 'historical', period] as const,
  companySearch: (query: string) => ['search', 'companies', query] as const,
} as const;
