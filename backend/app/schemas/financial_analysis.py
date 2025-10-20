"""
Financial Analysis Schemas for API Responses

This module provides API response schemas for financial analysis endpoints.
These schemas are designed to work with the new unified financial statement schemas.
"""

from __future__ import annotations

from typing import Any, Optional

from pydantic import BaseModel

from app.core.financial_ratios import RatioEvaluation


class RatioEvaluationData(BaseModel):
    """Individual ratio evaluation data."""

    value: float
    evaluation: RatioEvaluation


class ValuationAnalysis(BaseModel):
    """Comprehensive valuation analysis including ratios and DCF."""

    ticker: str
    ratios: Optional[dict[str, Any]] = None
    dcf_analysis: Optional[dict[str, Any]] = None
    forecasts: Optional[dict[str, Any]] = None
    analysis_warning: Optional[str] = None
    cache_status: Optional[str] = None
    cache_warning: Optional[bool] = None


class DCFAnalysis(BaseModel):
    """Discounted Cash Flow analysis results."""

    ticker: str
    base_results: dict[str, Any]
    analysis_warning: Optional[str] = None
    cache_status: Optional[str] = None
    cache_warning: Optional[bool] = None


class FCFPerShareData(BaseModel):
    """Free Cash Flow per share analysis."""

    ticker: str
    free_cash_flow: Optional[float] = None  # Total FCF in millions
    shares_outstanding: Optional[float] = None  # Shares in millions
    fcf_per_share: Optional[float] = None  # FCF per share in dollars
    year: Optional[str] = None  # Fiscal year of the data
    cache_status: Optional[str] = None


__all__ = [
    "DCFAnalysis",
    "FCFPerShareData",
    "RatioEvaluationData",
    "ValuationAnalysis",
]
