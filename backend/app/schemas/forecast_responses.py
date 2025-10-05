"""
Pydantic schemas for stock price forecasting responses.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ForecastPrediction(BaseModel):
    """Individual forecast prediction."""

    period: int = Field(..., description="Forecast period (days ahead)")
    prediction: float = Field(..., description="Predicted price")
    method: str = Field(..., description="Prediction method description")
    confidence_interval: Optional[Dict[str, float]] = Field(
        None, description="Confidence interval if available"
    )
    volatility_adjustment: Optional[float] = Field(
        None, description="Volatility adjustment if applicable"
    )


class ForecastModel(BaseModel):
    """Forecast model results."""

    model_name: str = Field(..., description="Name of the forecasting model")
    description: str = Field(..., description="Description of the model")
    predictions: List[ForecastPrediction] = Field(
        ..., description="List of predictions"
    )
    accuracy: str = Field(..., description="Model accuracy level")
    best_for: str = Field(..., description="Best use case for this model")
    metrics: Optional[Dict[str, float]] = Field(
        None, description="Model performance metrics"
    )


class ForecastSummary(BaseModel):
    """Summary of all forecast predictions."""

    total_models: int = Field(..., description="Total number of models used")
    average_prediction: float = Field(
        ..., description="Average prediction across all models"
    )
    prediction_range: Dict[str, float] = Field(
        ..., description="Min and max predictions"
    )
    confidence_score: float = Field(..., description="Overall confidence score (0-100)")


class StockForecastResponse(BaseModel):
    """Complete stock forecast response."""

    ticker: str = Field(..., description="Stock ticker symbol")
    current_price: float = Field(..., description="Current stock price")
    forecast_date: str = Field(..., description="Date when forecast was generated")
    models: Dict[str, ForecastModel] = Field(
        ..., description="Forecast results by model"
    )
    summary: ForecastSummary = Field(..., description="Summary of all predictions")
    disclaimer: str = Field(
        default="These predictions are for informational purposes only and should not be considered as investment advice. Past performance does not guarantee future results.",
        description="Investment disclaimer",
    )
