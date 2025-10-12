"""Financial analysis schemas for API responses."""

from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel


class RatioEvaluationData(BaseModel):
    """Individual ratio evaluation data."""

    value: Optional[float] = None
    evaluation: str  # "good", "poor", "unknown"
    color: str  # "success", "error", "default"
    icon: str  # "trending_up", "trending_down", "trending_flat"


class ProfitabilityRatios(BaseModel):
    """Profitability ratios."""

    ROE: Optional[float] = None
    ROA: Optional[float] = None
    ROIC: Optional[float] = None
    operating_margin: Optional[float] = None
    net_margin: Optional[float] = None
    revenue_growth_ebit: Optional[float] = None
    operating_income_growth: Optional[float] = None
    earnings_quality_ratio: Optional[float] = None  # FCF/net income


class LeverageRatios(BaseModel):
    """Leverage ratios."""

    debt_to_equity: Optional[float] = None
    debt_to_assets: Optional[float] = None
    debt_to_free_cash_ratio: Optional[float] = None
    interest_coverage_ratio: Optional[float] = None


class EfficiencyRatios(BaseModel):
    """Efficiency ratios."""

    asset_turnover: Optional[float] = None


class ValuationRatios(BaseModel):
    """Traditional valuation ratios."""

    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ps_ratio: Optional[float] = None
    peg_ratio: Optional[float] = None


class ValuationAnalysis(BaseModel):
    """Comprehensive valuation analysis including ratios and DCF."""

    ticker: str
    ratios: Optional[ValuationRatios] = None
    dcf_analysis: Optional[Dict[str, Any]] = None
    forecasts: Optional[Dict[str, Any]] = None
    analysis_warning: Optional[str] = None
    cache_status: Optional[str] = None
    cache_warning: Optional[bool] = None


class FinancialRatios(BaseModel):
    """Financial ratios analysis data with structured categories and evaluation."""

    ticker: str
    ratios: Dict[
        str, Any
    ]  # Contains profitability, leverage, efficiency, valuation groups with evaluation data


class FinancialRatiosStructured(BaseModel):
    """Structured financial ratios matching frontend expectations."""

    ticker: str
    ratios: Dict[str, Dict[str, Optional[float]]]  # Structured categories


class DCFAnalysis(BaseModel):
    """Discounted Cash Flow analysis results."""

    ticker: str
    base_results: Dict[str, Any]
    analysis_warning: Optional[str] = None
    cache_status: Optional[str] = None
    cache_warning: Optional[bool] = None


__all__ = [
    "DCFAnalysis",
    "EfficiencyRatios",
    "FinancialRatios",
    "FinancialRatiosStructured",
    "LeverageRatios",
    "ProfitabilityRatios",
    "RatioEvaluationData",
    "ValuationAnalysis",
    "ValuationRatios",
]
