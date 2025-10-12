"""
Router for stock price forecasting endpoints.
"""

import logging

from fastapi import APIRouter, Depends, HTTPException

from app.core.service_container import get_forecasting_service
from app.schemas.forecast_responses import StockForecastResponse
from app.services.forecasting_orchestration_service import (
    ForecastingOrchestrationService,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["forecasting"])


@router.get("/{ticker}/forecast", response_model=StockForecastResponse)
async def get_stock_forecast(
    ticker: str,
    forecasting_service: ForecastingOrchestrationService = Depends(get_forecasting_service),
) -> StockForecastResponse:
    """
    Get comprehensive stock price forecasts using multiple models.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Complete forecast response with multiple model predictions
    """
    try:
        forecast_results = await forecasting_service.get_stock_forecast(ticker)
        return StockForecastResponse(**forecast_results)
    except HTTPException:
        raise
    except (ValueError, KeyError) as e:
        logger.error(f"Unexpected error in forecast endpoint for {ticker}: {e!s}")
        raise HTTPException(
            status_code=500,
            detail=f"Internal server error while generating forecast for {ticker}",
        ) from e
