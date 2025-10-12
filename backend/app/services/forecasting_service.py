"""
Simplified Stock Price Forecasting Service

This service provides simple, easy-to-understand stock price forecasts using basic models.
Focuses on clear predictions without complex technical jargon or confusing periods.
"""

import logging
import warnings
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler

warnings.filterwarnings("ignore")

# Try to import basic ML libraries
try:
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning("scikit-learn not available. Some forecasting models will be disabled.")

logger = logging.getLogger(__name__)


class SimplifiedForecastingService:
    """
    Simplified service for easy-to-understand stock price forecasts.
    """

    def __init__(self):
        """Initialize the simplified forecasting service."""
        self.scaler = MinMaxScaler() if SKLEARN_AVAILABLE else None

    def get_forecast_predictions(
        self, ticker: str, historical_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get simple forecast predictions using basic models.

        Args:
            ticker: Stock ticker symbol
            historical_data: List of historical price data

        Returns:
            Dictionary containing simple predictions
        """
        try:
            if not historical_data or len(historical_data) < 30:
                raise ValueError(
                    f"Insufficient historical data for {ticker}. Need at least 30 data points."
                )

            # Convert to DataFrame
            df = pd.DataFrame(historical_data)
            df["date"] = pd.to_datetime(df["date"])
            df = df.sort_values("date")

            # Use closing prices
            prices = df["close"].values
            current_price = float(prices[-1])

            # Simple predictions for different time horizons
            predictions = self._get_simple_predictions(prices)

            # Calculate summary
            all_predictions = [pred["prediction"] for pred in predictions]
            avg_prediction = np.mean(all_predictions)
            min_prediction = np.min(all_predictions)
            max_prediction = np.max(all_predictions)

            # Simple confidence score based on prediction consistency
            prediction_std = np.std(all_predictions)
            confidence_score = max(0, min(100, 100 - (prediction_std / avg_prediction * 100)))

            forecast_results = {
                "ticker": ticker,
                "current_price": current_price,
                "predictions": predictions,
                "summary": {
                    "average_prediction": round(avg_prediction, 2),
                    "prediction_range": {
                        "min": round(min_prediction, 2),
                        "max": round(max_prediction, 2),
                    },
                    "confidence_score": round(confidence_score, 1),
                },
            }

            return forecast_results

        except (ValueError, KeyError, pd.errors.EmptyDataError) as e:
            logger.error(f"Error generating forecasts for {ticker}: {e!s}")
            raise ValueError(f"Failed to generate forecasts: {e!s}") from e

    def _get_simple_predictions(self, prices: np.ndarray) -> List[Dict[str, Any]]:
        """Generate simple predictions for different time horizons."""
        predictions = []

        # 1 Month prediction
        predictions.append(
            {
                "timeframe": "1 Month",
                "prediction": self._simple_trend_prediction(prices, 30),
                "method": "Trend Analysis",
            }
        )

        # 3 Months prediction
        predictions.append(
            {
                "timeframe": "3 Months",
                "prediction": self._simple_trend_prediction(prices, 90),
                "method": "Trend Analysis",
            }
        )

        # 6 Months prediction
        predictions.append(
            {
                "timeframe": "6 Months",
                "prediction": self._simple_trend_prediction(prices, 180),
                "method": "Trend Analysis",
            }
        )

        # 1 Year prediction
        predictions.append(
            {
                "timeframe": "1 Year",
                "prediction": self._simple_trend_prediction(prices, 365),
                "method": "Trend Analysis",
            }
        )

        return predictions

    def _simple_trend_prediction(self, prices: np.ndarray, days_ahead: int) -> float:
        """Simple trend-based prediction."""
        if len(prices) < 10:
            return float(prices[-1])

        # Calculate simple moving average trend
        short_window = min(10, len(prices) // 3)
        long_window = min(30, len(prices) // 2)

        short_ma = np.mean(prices[-short_window:])
        long_ma = np.mean(prices[-long_window:])

        # Calculate trend
        trend = (short_ma - long_ma) / long_ma

        # Apply trend to current price
        current_price = prices[-1]
        predicted_price = current_price * (1 + trend * (days_ahead / 365))

        # Add some volatility adjustment
        volatility = np.std(prices[-30:]) / np.mean(prices[-30:]) if len(prices) >= 30 else 0.1
        rng = np.random.default_rng()
        volatility_adjustment = rng.normal(0, volatility * 0.1)

        return max(0, predicted_price * (1 + volatility_adjustment))


# Create global instance
forecasting_service = SimplifiedForecastingService()
