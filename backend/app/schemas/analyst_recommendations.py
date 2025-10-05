"""Analyst recommendation schemas for API responses."""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class RecommendationType(str, Enum):
    """Types of investment recommendations."""

    STRONG_BUY = "STRONG_BUY"
    BUY = "BUY"
    HOLD = "HOLD"
    SELL = "SELL"
    STRONG_SELL = "STRONG_SELL"


class RiskLevel(str, Enum):
    """Risk levels for investments."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    VERY_HIGH = "VERY_HIGH"


class AnalystRecommendation(BaseModel):
    """Junior analyst recommendation based on DCF analysis and stock price."""

    ticker: str
    recommendation: RecommendationType
    target_price: float
    current_price: float
    upside_potential: float  # Percentage upside/downside
    confidence_score: float  # 0-100 confidence in recommendation
    risk_level: RiskLevel
    reasoning: List[str]  # Key reasons for the recommendation
    key_metrics: Dict[str, Any]  # Important financial metrics
    dcf_intrinsic_value: float
    price_to_intrinsic_ratio: float
    analysis_timestamp: str
    analyst_notes: Optional[str] = None


__all__ = [
    "RecommendationType",
    "RiskLevel",
    "AnalystRecommendation",
]
