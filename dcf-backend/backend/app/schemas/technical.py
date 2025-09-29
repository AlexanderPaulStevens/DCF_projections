"""Pydantic models for technical analysis API resources."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class IndicatorConfig(BaseModel):
    """Configuration provided by the client for a technical indicator."""

    name: str = Field(..., description="Indicator identifier, e.g., SMA, RSI")
    params: Dict[str, Any] = Field(
        default_factory=dict, description="Indicator parameters"
    )
    display: Literal["overlay", "subchart", "pattern"] = Field(
        "overlay", description="Preferred rendering position for the indicator"
    )


class TechnicalAnalysisRequest(BaseModel):
    """Request payload for technical analysis computation."""

    period: str = Field("6mo", description="Historical window to analyse")
    interval: str = Field(
        "1d", description="Sampling interval (currently informational)"
    )
    chart_type: Literal["line", "candlestick", "area"] = Field(
        "candlestick", description="Preferred chart style"
    )
    include_volume: bool = Field(
        True, description="Whether to include volume in responses"
    )
    comparison_ticker: Optional[str] = Field(
        None, description="Optional secondary ticker for comparison"
    )
    indicators: List[IndicatorConfig] = Field(
        default_factory=list, description="Collection of indicators to compute"
    )


class PricePoint(BaseModel):
    """Serialised OHLCV datapoint for charting."""

    date: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float


class IndicatorSeries(BaseModel):
    """Single output series for an indicator."""

    name: str
    values: List[Optional[float]]


class IndicatorResponse(BaseModel):
    """Indicator metadata and computed values."""

    id: str
    name: str
    label: str
    display: Literal["overlay", "subchart", "pattern"]
    color: Optional[str]
    series: List[IndicatorSeries]
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PatternOccurrence(BaseModel):
    """Occurrence of a candlestick pattern signal."""

    date: datetime
    value: int


class PatternResponse(BaseModel):
    """Pattern detection payload."""

    name: str
    label: str
    occurrences: List[PatternOccurrence]


class ComparisonSeriesPoint(BaseModel):
    """Datapoint for comparison ticker."""

    date: datetime
    value: Optional[float]


class ComparisonResponse(BaseModel):
    """Comparison ticker payload."""

    ticker: str
    label: str
    series: List[ComparisonSeriesPoint]


class TechnicalAnalysisMeta(BaseModel):
    """Supplementary information for the frontend experience."""

    available_indicators: Dict[str, List[Dict[str, Any]]]
    chart_types: List[str]
    periods: List[str]
    active_config: Dict[str, Any]
    generated_at: datetime


class TechnicalAnalysisResponse(BaseModel):
    """Response payload returned by the technical analysis endpoint."""

    ticker: str
    period: str
    interval: str
    chart_type: Literal["line", "candlestick", "area"]
    include_volume: bool
    price: List[PricePoint]
    indicators: List[IndicatorResponse]
    patterns: List[PatternResponse]
    comparison: Optional[ComparisonResponse]
    meta: TechnicalAnalysisMeta


__all__ = [
    "IndicatorConfig",
    "TechnicalAnalysisRequest",
    "PricePoint",
    "IndicatorSeries",
    "IndicatorResponse",
    "PatternOccurrence",
    "PatternResponse",
    "ComparisonResponse",
    "TechnicalAnalysisMeta",
    "TechnicalAnalysisResponse",
]
