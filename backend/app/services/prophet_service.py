"""
Prophet Service - Live stock price forecasting using Facebook Prophet
"""

import pandas as pd
from typing import Dict, Any, Optional
from datetime import datetime
import yfinance as yf
from prophet import Prophet
import logging

logger = logging.getLogger(__name__)


class ProphetService:
    """Service for live Prophet-based stock price forecasting."""

    def __init__(self):
        """Initialize the Prophet service."""
        self.cache = {}
        self.cache_duration = 3600  # 1 hour cache for forecasts

    def get_forecast(self, ticker: str, periods: int = 365) -> Dict[str, Any]:
        """
        Generate live Prophet forecast for a stock.

        Args:
            ticker: Stock ticker symbol
            periods: Number of days to forecast

        Returns:
            Dictionary containing forecast data
        """
        try:
            # Check cache first
            cache_key = f"prophet_forecast_{ticker}_{periods}"
            if self._is_cached(cache_key):
                logger.info(f"Using cached Prophet forecast for {ticker}")
                return self.cache[cache_key]["data"]

            # Get historical data
            historical_data = self._get_historical_data(ticker)
            if historical_data is None or historical_data.empty:
                raise ValueError(f"No historical data available for {ticker}")

            # Validate data quality
            if len(historical_data) < 30:  # Need at least 30 days of data
                raise ValueError(
                    f"Insufficient historical data for {ticker} (need at least 30 days)"
                )

            # Check for reasonable price values
            if historical_data["y"].min() <= 0 or historical_data["y"].max() > 10000:
                raise ValueError(f"Unreasonable price values detected for {ticker}")

            # Prepare data for Prophet
            prophet_data = self._prepare_prophet_data(historical_data)

            # Create and fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode="additive",  # Changed to additive for stock prices
                changepoint_prior_scale=0.1,  # Increased for more flexibility
                seasonality_prior_scale=10.0,
                growth="linear",  # Explicitly set growth model
            )

            # Add custom seasonalities
            model.add_seasonality(name="monthly", period=30.5, fourier_order=5)

            # Fit the model
            model.fit(prophet_data)

            # Make future dataframe
            future = model.make_future_dataframe(periods=periods)

            # Generate forecast
            forecast = model.predict(future)

            # Extract forecast data
            forecast_data = self._extract_forecast_data(
                forecast, historical_data, periods
            )

            # Cache the result
            self.cache[cache_key] = {"data": forecast_data, "timestamp": datetime.now()}

            logger.info(f"Generated live Prophet forecast for {ticker}")
            return forecast_data

        except Exception as e:
            logger.error(f"Error generating Prophet forecast for {ticker}: {str(e)}")
            raise ValueError(f"Failed to generate forecast: {str(e)}")

    def _get_historical_data(
        self, ticker: str, period: str = "5y"
    ) -> Optional[pd.DataFrame]:
        """Get historical stock data from Yahoo Finance."""
        try:
            stock = yf.Ticker(ticker)
            hist = stock.history(period=period)

            if hist.empty:
                return None

            # Reset index to get date as column
            hist = hist.reset_index()

            # Keep only necessary columns
            hist = hist[["Date", "Close"]].copy()
            hist.columns = ["ds", "y"]

            # Remove any NaN values
            hist = hist.dropna()

            return hist

        except Exception as e:
            logger.error(f"Error fetching historical data for {ticker}: {str(e)}")
            return None

    def _prepare_prophet_data(self, data: pd.DataFrame) -> pd.DataFrame:
        """Prepare data for Prophet model."""
        # Ensure proper data types
        data["ds"] = pd.to_datetime(data["ds"])
        data["y"] = pd.to_numeric(data["y"], errors="coerce")

        # Remove timezone information (Prophet doesn't support timezone-aware datetimes)
        if data["ds"].dt.tz is not None:
            data["ds"] = data["ds"].dt.tz_localize(None)

        # Remove any remaining NaN values
        data = data.dropna()

        # Ensure data is sorted by date
        data = data.sort_values("ds").reset_index(drop=True)

        return data

    def _extract_forecast_data(
        self, forecast: pd.DataFrame, historical_data: pd.DataFrame, periods: int
    ) -> Dict[str, Any]:
        """Extract forecast data in the expected format."""
        # Get the last historical price
        current_price = historical_data["y"].iloc[-1]

        # Get forecast data (only future periods)
        future_forecast = forecast.tail(periods)

        # Calculate forecast price (last forecasted value)
        forecast_price = future_forecast["yhat"].iloc[-1]

        # Calculate trend (percentage change from current to forecast)
        forecast_trend = ((forecast_price - current_price) / current_price) * 100

        # Get confidence intervals
        confidence_lower = future_forecast["yhat_lower"].iloc[-1]
        confidence_upper = future_forecast["yhat_upper"].iloc[-1]

        # Prepare forecast dates and values
        forecast_dates = future_forecast["ds"].dt.strftime("%Y-%m-%d").tolist()
        forecast_values = future_forecast["yhat"].tolist()

        return {
            "ticker": "TICKER",  # Will be set by caller
            "current_price": float(current_price),
            "forecast_price": float(forecast_price),
            "forecast_trend": float(forecast_trend),
            "confidence_lower": float(confidence_lower),
            "confidence_upper": float(confidence_upper),
            "forecast_dates": forecast_dates,
            "forecast_values": [float(x) for x in forecast_values],
        }

    def _is_cached(self, cache_key: str) -> bool:
        """Check if data is cached and still valid."""
        if cache_key not in self.cache:
            return False

        cache_time = self.cache[cache_key]["timestamp"]
        age = (datetime.now() - cache_time).total_seconds()

        return age < self.cache_duration

    def clear_cache(self):
        """Clear the forecast cache."""
        self.cache.clear()
        logger.info("Prophet forecast cache cleared")
