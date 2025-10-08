"""
Simplified Pydantic schemas for stock price forecasting responses.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SimplePrediction(BaseModel):
    """Simple forecast prediction."""

    timeframe: str = Field(
        ..., description="Time horizon (e.g., '1 Month', '3 Months')"
    )
    prediction: float = Field(..., description="Predicted price")
    method: str = Field(..., description="Prediction method")


class SimpleForecastSummary(BaseModel):
    """Summary of forecast predictions."""

    average_prediction: float = Field(
        ..., description="Average prediction across all timeframes"
    )
    prediction_range: Dict[str, float] = Field(
        ..., description="Min and max predictions"
    )
    confidence_score: float = Field(..., description="Overall confidence score (0-100)")


class StockForecastResponse(BaseModel):
    """Simplified stock forecast response."""

    ticker: str = Field(..., description="Stock ticker symbol")
    current_price: float = Field(..., description="Current stock price")
    predictions: List[SimplePrediction] = Field(
        ..., description="List of predictions by timeframe"
    )
    summary: SimpleForecastSummary = Field(
        ..., description="Summary of all predictions"
    )
