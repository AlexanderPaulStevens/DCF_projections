"""Pydantic schemas for company-related API responses."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class CompanySearchResult(BaseModel):
    ticker: str
    name: str
    sector: Optional[str] = None


class CompanyOverview(BaseModel):
    ticker: str
    overview: Dict[str, Any]
    financial_data: Optional[Dict[str, Any]] = None


class FinancialRatios(BaseModel):
    ticker: str
    ratios: Dict[str, Any]
    raw_data: Dict[str, Any]


class DCFAnalysis(BaseModel):
    ticker: str
    base_results: Dict[str, Any]
    scenarios: List[Dict[str, Any]]
    parameters: Dict[str, Any]


class SensitivityAnalysis(BaseModel):
    ticker: str
    variable: str
    base_value: float
    steps: List[Dict[str, Any]]


class ForecastAnalysis(BaseModel):
    ticker: str
    current_price: float
    forecast_price: float
    forecast_trend: float
    confidence_lower: float
    confidence_upper: float
    forecast_dates: List[str]
    forecast_values: List[float]


class StockData(BaseModel):
    ticker: str
    name: str
    current_price: float
    previous_close: float
    open: float
    day_low: float
    day_high: float
    fifty_two_week_low: float
    fifty_two_week_high: float
    volume: int
    avg_volume: int
    market_cap: int
    beta: float
    pe_ratio: float
    forward_pe: float
    eps: float
    forward_eps: float
    dividend_yield: float
    ex_dividend_date: Optional[str] = None
    earnings_date: Optional[str] = None
    target_price: float
    recommendation: str
    currency: str
    exchange: str
    sector: str
    industry: str
    website: str
    description: str
    employees: int
    city: str
    state: str
    country: str
    price_change: float
    price_change_percent: float
    last_updated: str


class CompetitorData(BaseModel):
    ticker: str
    name: str
    market_cap: float
    sector: str
    industry: str
    pe_ratio: Optional[float]
    revenue: Optional[float]
    profit_margin: Optional[float]
    roe: Optional[float]
    debt_to_equity: Optional[float]
    current_ratio: Optional[float]
    revenue_growth: Optional[float]
    earnings_growth: Optional[float]


class CompetitiveAnalysis(BaseModel):
    target_company: Dict[str, Any]
    competitors: List[CompetitorData]
    comparison_metrics: Dict[str, Any]
    insights: Dict[str, Any]
    analysis_date: str


class StrategyInsight(BaseModel):
    category: str
    insight: str
    confidence: float
    source: str


class SurvivalMetrics(BaseModel):
    altman_z_score: Optional[float]
    current_ratio: Optional[float]
    debt_to_equity: Optional[float]
    interest_coverage: Optional[float]
    cash_ratio: Optional[float]
    survival_probability: float
    risk_level: str


class BusinessStrategyAnalysis(BaseModel):
    ticker: str
    strategy_insights: List[StrategyInsight]
    business_model_analysis: Dict[str, Any]
    survival_metrics: SurvivalMetrics
    recommendations: List[str]
    analysis_date: str


class CompetitiveAdvantage(BaseModel):
    category: str
    strength_score: float
    description: str
    evidence: List[str]
    sustainability: str
    impact_on_valuation: str


class PortersFiveForces(BaseModel):
    supplier_power: Dict[str, Any]
    buyer_power: Dict[str, Any]
    competitive_rivalry: Dict[str, Any]
    threat_of_substitution: Dict[str, Any]
    threat_of_new_entrants: Dict[str, Any]
    overall_industry_attractiveness: str


class MoatStrength(BaseModel):
    score: float
    level: str
    description: str
    breakdown: Dict[str, float]


class InvestmentThesis(BaseModel):
    thesis: str
    recommendation: str
    risk_factors: List[str]
    opportunities: List[str]


class SectorInsights(BaseModel):
    sector: str
    key_advantages: List[str]
    insights: List[str]
    recommendations: List[str]
    template_details: Dict[str, Any]


class CompetitiveAdvantageAnalysis(BaseModel):
    ticker: str
    company_info: Dict[str, Any]
    competitive_advantages: Dict[str, CompetitiveAdvantage]
    porters_five_forces: PortersFiveForces
    sector_insights: SectorInsights
    overall_moat_strength: MoatStrength
    investment_thesis: InvestmentThesis
    analysis_date: str


class AnalysisSummary(BaseModel):
    dcf_value: Optional[float]
    current_price: Optional[float]
    upside_potential: Optional[float]
    moat_strength_score: float
    moat_level: str
    industry_attractiveness: str
    investment_recommendation: str
    risk_level: str


class ValuationMetrics(BaseModel):
    dcf_per_share: Optional[float]
    current_price: Optional[float]
    price_target: Optional[float]
    upside_downside: Optional[float]
    pe_ratio: Optional[float]
    pb_ratio: Optional[float]
    market_cap: Optional[float]
    enterprise_value: Optional[float]


class CompetitiveMetrics(BaseModel):
    ecosystem_score: float
    brand_score: float
    integration_score: float
    supply_chain_score: float
    strategic_score: float
    overall_moat_score: float
    moat_level: str
    top_advantage: str
    weakest_area: str


class RiskMetrics(BaseModel):
    competitive_risks: List[str]
    industry_risks: List[str]
    financial_risks: List[str]
    overall_risk_level: str
    risk_factors_count: int


class OpportunityMetrics(BaseModel):
    growth_opportunities: List[str]
    market_expansion_potential: str
    innovation_capability: str
    strategic_advantages: List[str]


class ComprehensiveAnalysis(BaseModel):
    ticker: str
    company_name: str
    sector: str
    industry: str
    summary: AnalysisSummary
    valuation: ValuationMetrics
    competitive: CompetitiveMetrics
    risks: RiskMetrics
    opportunities: OpportunityMetrics
    dcf_analysis: Optional[DCFAnalysis]
    competitive_advantage: Optional[CompetitiveAdvantageAnalysis]
    financial_ratios: Optional[FinancialRatios]
    current_price: Optional[float]
    market_cap: Optional[float]
    volume: Optional[float]
    price_change: Optional[float]
    price_change_percent: Optional[float]
    analysis_date: str
    data_sources: List[str]
    confidence_score: float


__all__ = [
    "AnalysisSummary",
    "BusinessStrategyAnalysis",
    "CompanyOverview",
    "CompanySearchResult",
    "CompetitiveAdvantage",
    "CompetitiveAdvantageAnalysis",
    "CompetitiveAnalysis",
    "CompetitiveMetrics",
    "ComprehensiveAnalysis",
    "DCFAnalysis",
    "FinancialRatios",
    "ForecastAnalysis",
    "InvestmentThesis",
    "MoatStrength",
    "OpportunityMetrics",
    "PortersFiveForces",
    "RiskMetrics",
    "SectorInsights",
    "SensitivityAnalysis",
    "StockData",
    "StrategyInsight",
    "SurvivalMetrics",
    "ValuationMetrics",
]
