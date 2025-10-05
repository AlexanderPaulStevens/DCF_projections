"""
Router for stock price forecasting endpoints.
"""

import logging
from typing import Any, Dict

from app.schemas.forecast_responses import StockForecastResponse
from app.services.forecasting_service import forecasting_service
from app.services.yahoo_finance_service import YahooFinanceService
from fastapi import APIRouter, Depends, HTTPException

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/companies", tags=["forecasting"])


@router.get("/{ticker}/forecast", response_model=StockForecastResponse)
async def get_stock_forecast(ticker: str) -> StockForecastResponse:
    """
    Get comprehensive stock price forecasts using multiple models.

    Args:
        ticker: Stock ticker symbol

    Returns:
        Complete forecast response with multiple model predictions
    """
    try:
        ticker = ticker.upper()
        logger.info(f"Generating stock forecast for {ticker}")

        # Get historical data
        yahoo_service = YahooFinanceService()
        hist_df = yahoo_service.get_historical_data(ticker, period="1y")

        if hist_df is None or hist_df.empty:
            raise HTTPException(
                status_code=400, detail=f"No historical data available for {ticker}"
            )

        # Convert DataFrame to list of dictionaries
        historical_data = yahoo_service._process_historical_data(hist_df)

        if not historical_data or len(historical_data) < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient historical data for {ticker}. Need at least 30 data points.",
            )

        # Generate forecasts
        forecast_results = forecasting_service.get_forecast_predictions(
            ticker, historical_data
        )

        logger.info(f"Successfully generated forecasts for {ticker}")
        return StockForecastResponse(**forecast_results)

    except ValueError as e:
        logger.error(f"Validation error for {ticker}: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error generating forecast for {ticker}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate forecast for {ticker}. Please try again later.",
        )
