"""Financial analysis schemas for API responses."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class FinancialRatios(BaseModel):
    """Financial ratios analysis data."""

    ticker: str
    ratios: Dict[str, Any]
    raw_data: Dict[str, Any]


class DCFAnalysis(BaseModel):
    """Discounted Cash Flow analysis results."""

    ticker: str
    base_results: Dict[str, Any]
    scenarios: List[Dict[str, Any]]
    parameters: Dict[str, Any]
    cache_status: Optional[str] = None
    cache_warning: Optional[bool] = None
    analysis_warning: Optional[str] = None


__all__ = [
    "FinancialRatios",
    "DCFAnalysis",
]
