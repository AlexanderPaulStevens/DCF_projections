"""
Forecasting Service Layer - Orchestrates stock price forecasting operations.

This service handles the coordination between data fetching, caching,
and forecasting calculations. It follows clean architecture principles
by keeping business logic separate from HTTP concerns.
"""

import logging
from typing import Any, Dict, List

from fastapi import HTTPException

from app.services.company_data_service import CompanyDataService
from app.services.forecasting_service import SimplifiedForecastingService
from app.services.yahoo_finance_service import YahooFinanceService

logger = logging.getLogger(__name__)


class ForecastingOrchestrationService:
    """
    Service layer for forecasting operations.
    Handles data fetching, validation, and forecasting orchestration.
    """

    def __init__(self):
        self.company_data_service = CompanyDataService()
        self.forecasting_service = SimplifiedForecastingService()

    async def get_stock_forecast(self, ticker: str) -> Dict[str, Any]:
        """
        Get comprehensive stock price forecasts for a company.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Complete forecast response with multiple model predictions
        """
        try:
            ticker = ticker.upper()
            logger.info(f"Generating stock forecast for {ticker}")

            # Get historical data using the service container
            historical_data = await self._get_historical_data(ticker)

            # Validate data sufficiency
            if not historical_data or len(historical_data) < 30:
                msg = f"Insufficient historical data for {ticker}. Need at least 30 data points."
                raise HTTPException(
                    status_code=400,
                    detail=msg,
                )

            # Generate forecasts using the forecasting service
            forecast_results = self.forecasting_service.get_forecast_predictions(
                ticker, historical_data
            )

            logger.info(f"Successfully generated forecasts for {ticker}")
            return forecast_results

        except HTTPException:
            raise
        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Unexpected error generating forecast for {ticker}: {e!s}")
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate forecast for {ticker}. Please try again later.",
            ) from e

    async def _get_historical_data(self, ticker: str) -> List[Dict[str, Any]]:
        """
        Get historical data for forecasting.

        Args:
            ticker: Stock ticker symbol

        Returns:
            List of historical price data
        """
        try:
            # Get historical data using Yahoo Finance service
            yahoo_service = YahooFinanceService()
            hist_df = yahoo_service.get_historical_data(ticker, period="1y")

            if hist_df is None or hist_df.empty:
                logger.warning(f"No historical data available for {ticker}, using mock data")
                return []  # empty list for now

            # Convert DataFrame to list of dictionaries
            historical_data = yahoo_service._process_historical_data(hist_df)

            return historical_data

        except (ValueError, AttributeError) as e:
            logger.error(f"Error getting historical data for {ticker}: {e!s}")
            # Return empty list as fallback
            return []

    def _extract_historical_data_from_raw(self, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Extract historical data from raw company data.

        This implementation extracts historical data from the raw company data
        and formats it for the forecasting service.

        Args:
            raw_data: Raw company data

        Returns:
            List of historical data points
        """
        try:
            # Extract historical data from raw data
            # The raw data should contain historical price information
            historical_data = []

            # Check if we have historical data in the raw data
            if raw_data.get("historical_data"):
                historical_data = raw_data["historical_data"]
            elif raw_data.get("price_history"):
                historical_data = raw_data["price_history"]
            else:
                # If no historical data available, create mock data for testing
                # In production, you'd want to fetch this from Yahoo Finance
                logger.warning("No historical data found in raw data, using mock data")
                historical_data = []  # empty list for now

            return historical_data

        except (ValueError, KeyError, AttributeError) as e:
            logger.error(f"Error extracting historical data: {e!s}")
            # Return empty list as fallback
            return []
