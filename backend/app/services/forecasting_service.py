"""
Advanced Stock Price Forecasting Service with SOTA Models

This service implements multiple state-of-the-art forecasting models for stock price predictions.
Models include: Prophet and traditional models like ARIMA, Linear Regression, Moving Average, and Exponential Smoothing.
"""

import logging
import warnings
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# Try to import ML libraries, handle gracefully if not available
try:
    from sklearn.linear_model import LinearRegression
    from sklearn.metrics import mean_absolute_error, mean_squared_error
    from sklearn.preprocessing import MinMaxScaler

    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False
    logging.warning(
        "scikit-learn not available. Some forecasting models will be disabled."
    )

try:
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.holtwinters import ExponentialSmoothing

    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    logging.warning(
        "statsmodels not available. ARIMA and Exponential Smoothing models will be disabled."
    )

# SOTA Models
try:
    from prophet import Prophet

    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    logging.warning("Prophet not available. Facebook's Prophet model will be disabled.")

    # Darts disabled due to dependency conflicts
    DARTS_AVAILABLE = False

    # NeuralProphet disabled due to dependency conflicts
    NEURALPROPHET_AVAILABLE = False

    # Greykite disabled due to dependency conflicts
    GREYKITE_AVAILABLE = False

logger = logging.getLogger(__name__)


class AdvancedForecastingService:
    """
    Advanced service for implementing multiple SOTA stock price forecasting models.
    """

    def __init__(self):
        """Initialize the advanced forecasting service."""
        self.scaler = MinMaxScaler() if SKLEARN_AVAILABLE else None

    def get_forecast_predictions(
        self, ticker: str, historical_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Get comprehensive forecast predictions using multiple SOTA models.

        Args:
            ticker: Stock ticker symbol
            historical_data: List of historical price data

        Returns:
            Dictionary containing predictions from all models
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
            dates = df["date"].values

            # Prepare forecast results
            forecast_results = {
                "ticker": ticker,
                "current_price": float(prices[-1]),
                "forecast_date": datetime.now().isoformat(),
                "models": {},
                "summary": {
                    "total_models": 0,
                    "average_prediction": 0,
                    "prediction_range": {"min": 0, "max": 0},
                    "confidence_score": 0,
                },
            }

            predictions = []
            model_count = 0

            # Traditional Models
            traditional_predictions = self._get_traditional_models(prices, dates)
            for model_name, model_data in traditional_predictions.items():
                if model_data:
                    forecast_results["models"][model_name] = model_data
                    predictions.extend(
                        [p["prediction"] for p in model_data["predictions"]]
                    )
                    model_count += 1

            # SOTA Models
            sota_predictions = self._get_sota_models(df, prices, dates)
            for model_name, model_data in sota_predictions.items():
                if model_data:
                    forecast_results["models"][model_name] = model_data
                    predictions.extend(
                        [p["prediction"] for p in model_data["predictions"]]
                    )
                    model_count += 1

            # Calculate summary statistics
            if predictions:
                forecast_results["summary"] = {
                    "total_models": model_count,
                    "average_prediction": float(np.mean(predictions)),
                    "prediction_range": {
                        "min": float(np.min(predictions)),
                        "max": float(np.max(predictions)),
                    },
                    "confidence_score": self._calculate_confidence_score(
                        predictions, prices[-1]
                    ),
                }

            logger.info(f"Generated forecasts for {ticker} using {model_count} models")
            return forecast_results

        except Exception as e:
            logger.error(f"Error generating forecasts for {ticker}: {str(e)}")
            raise ValueError(f"Failed to generate forecasts for {ticker}: {str(e)}")

    def _get_traditional_models(
        self, prices: np.ndarray, dates: np.ndarray
    ) -> Dict[str, Any]:
        """Get predictions from traditional forecasting models."""
        models = {}

        # Moving Average Models
        models["moving_average"] = self._moving_average_forecast(prices, dates)

        # Linear Regression
        if SKLEARN_AVAILABLE:
            models["linear_regression"] = self._linear_regression_forecast(
                prices, dates
            )

        # ARIMA Model
        if STATSMODELS_AVAILABLE:
            models["arima"] = self._arima_forecast(prices, dates)
            models["exponential_smoothing"] = self._exponential_smoothing_forecast(
                prices, dates
            )

        # Trend Analysis
        models["trend_analysis"] = self._trend_analysis_forecast(prices, dates)

        return models

    def _get_sota_models(
        self, df: pd.DataFrame, prices: np.ndarray, dates: np.ndarray
    ) -> Dict[str, Any]:
        """Get predictions from SOTA forecasting models."""
        models = {}

        # Facebook Prophet
        if PROPHET_AVAILABLE:
            models["prophet"] = self._prophet_forecast(df)

        return models

    def _prophet_forecast(self, df: pd.DataFrame) -> Optional[Dict[str, Any]]:
        """Generate Prophet forecasts."""
        try:
            # Prepare data for Prophet
            prophet_df = df[["date", "close"]].copy()
            prophet_df.columns = ["ds", "y"]

            # Fit Prophet model
            model = Prophet(
                yearly_seasonality=True,
                weekly_seasonality=True,
                daily_seasonality=False,
                seasonality_mode="multiplicative",
                changepoint_prior_scale=0.05,
                seasonality_prior_scale=10.0,
            )
            model.fit(prophet_df)

            # Generate future dataframe
            future = model.make_future_dataframe(periods=5, freq="D")
            forecast = model.predict(future)

            # Extract predictions
            predictions = []
            for i in range(1, 6):  # Next 5 days
                pred_value = forecast["yhat"].iloc[-6 + i]
                lower_bound = forecast["yhat_lower"].iloc[-6 + i]
                upper_bound = forecast["yhat_upper"].iloc[-6 + i]

                predictions.append(
                    {
                        "period": i,
                        "prediction": float(pred_value),
                        "confidence_interval": {
                            "lower": float(lower_bound),
                            "upper": float(upper_bound),
                        },
                        "method": f"Prophet Day {i}",
                    }
                )

            return {
                "model_name": "Facebook Prophet",
                "description": "Facebook's robust time series forecasting with seasonality",
                "predictions": predictions,
                "accuracy": "High",
                "best_for": "Time series with trends and seasonality",
                "metrics": {
                    "trend_strength": (
                        float(forecast["trend"].iloc[-1] - forecast["trend"].iloc[-30])
                        if len(forecast) > 30
                        else 0
                    ),
                    "seasonality_strength": (
                        float(forecast["yearly"].std())
                        if "yearly" in forecast.columns
                        else 0
                    ),
                },
            }
        except Exception as e:
            logger.warning(f"Prophet forecast failed: {str(e)}")
        return None

    def _moving_average_forecast(
        self, prices: np.ndarray, dates: np.ndarray
    ) -> Optional[Dict[str, Any]]:
        """Generate moving average forecasts."""
        try:
            # Different moving average periods
            periods = [5, 10, 20, 50]
            predictions = []

            for period in periods:
                if len(prices) >= period:
                    ma = np.mean(prices[-period:])
                    predictions.append(
                        {
                            "period": period,
                            "prediction": float(ma),
                            "method": f"{period}-day MA",
                        }
                    )

            if predictions:
                return {
                    "model_name": "Moving Average",
                    "description": "Simple moving average of recent prices",
                    "predictions": predictions,
                    "accuracy": "Medium",
                    "best_for": "Short-term trends",
                }
        except Exception as e:
            logger.warning(f"Moving average forecast failed: {str(e)}")
        return None

    def _linear_regression_forecast(
        self, prices: np.ndarray, dates: np.ndarray
    ) -> Optional[Dict[str, Any]]:
        """Generate linear regression forecasts."""
        try:
            if not SKLEARN_AVAILABLE or len(prices) < 20:
                return None

            # Create time series features
            X = np.arange(len(prices)).reshape(-1, 1)
            y = prices

            # Fit linear regression
            model = LinearRegression()
            model.fit(X, y)

            # Generate predictions for next 5 days
            future_X = np.arange(len(prices), len(prices) + 5).reshape(-1, 1)
            future_predictions = model.predict(future_X)

            predictions = []
            for i, pred in enumerate(future_predictions):
                predictions.append(
                    {
                        "period": i + 1,
                        "prediction": float(pred),
                        "method": f"LR Day {i + 1}",
                    }
                )

            # Calculate accuracy metrics
            train_predictions = model.predict(X)
            mse = mean_squared_error(y, train_predictions)
            mae = mean_absolute_error(y, train_predictions)

            return {
                "model_name": "Linear Regression",
                "description": "Linear trend analysis using historical data",
                "predictions": predictions,
                "accuracy": "Medium",
                "best_for": "Trend identification",
                "metrics": {
                    "mse": float(mse),
                    "mae": float(mae),
                    "r_squared": float(model.score(X, y)),
                },
            }
        except Exception as e:
            logger.warning(f"Linear regression forecast failed: {str(e)}")
        return None

    def _arima_forecast(
        self, prices: np.ndarray, dates: np.ndarray
    ) -> Optional[Dict[str, Any]]:
        """Generate ARIMA forecasts."""
        try:
            if not STATSMODELS_AVAILABLE or len(prices) < 50:
                return None

            # Fit ARIMA model
            model = ARIMA(prices, order=(1, 1, 1))
            fitted_model = model.fit()

            # Generate forecasts
            forecast_result = fitted_model.forecast(steps=5)
            forecast_ci = fitted_model.get_forecast(steps=5).conf_int()

            predictions = []
            for i, (pred, (lower, upper)) in enumerate(
                zip(forecast_result, forecast_ci)
            ):
                predictions.append(
                    {
                        "period": i + 1,
                        "prediction": float(pred),
                        "confidence_interval": {
                            "lower": float(lower),
                            "upper": float(upper),
                        },
                        "method": f"ARIMA Day {i + 1}",
                    }
                )

            return {
                "model_name": "ARIMA",
                "description": "AutoRegressive Integrated Moving Average model",
                "predictions": predictions,
                "accuracy": "High",
                "best_for": "Time series forecasting",
                "metrics": {
                    "aic": float(fitted_model.aic),
                    "bic": float(fitted_model.bic),
                },
            }
        except Exception as e:
            logger.warning(f"ARIMA forecast failed: {str(e)}")
        return None

    def _exponential_smoothing_forecast(
        self, prices: np.ndarray, dates: np.ndarray
    ) -> Optional[Dict[str, Any]]:
        """Generate exponential smoothing forecasts."""
        try:
            if not STATSMODELS_AVAILABLE or len(prices) < 20:
                return None

            # Fit exponential smoothing model
            model = ExponentialSmoothing(prices, trend="add", seasonal=None)
            fitted_model = model.fit()

            # Generate forecasts
            forecast_result = fitted_model.forecast(steps=5)

            predictions = []
            for i, pred in enumerate(forecast_result):
                predictions.append(
                    {
                        "period": i + 1,
                        "prediction": float(pred),
                        "method": f"ES Day {i + 1}",
                    }
                )

            return {
                "model_name": "Exponential Smoothing",
                "description": "Exponential smoothing with trend",
                "predictions": predictions,
                "accuracy": "Medium",
                "best_for": "Smooth trend forecasting",
                "metrics": {
                    "sse": float(fitted_model.sse),
                    "aic": float(fitted_model.aic),
                },
            }
        except Exception as e:
            logger.warning(f"Exponential smoothing forecast failed: {str(e)}")
        return None

    def _trend_analysis_forecast(
        self, prices: np.ndarray, dates: np.ndarray
    ) -> Optional[Dict[str, Any]]:
        """Generate trend analysis forecasts."""
        try:
            if len(prices) < 10:
                return None

            # Calculate recent trend
            recent_prices = prices[-10:]
            trend_slope = float(
                np.polyfit(range(len(recent_prices)), recent_prices, 1)[0]
            )

            # Calculate volatility
            if len(prices) >= 21:
                price_changes = np.diff(prices[-20:])
                previous_prices = prices[-20:-1]  # Same length as price_changes
                returns = price_changes / previous_prices
                volatility = float(np.std(returns) * np.sqrt(252))  # Annualized
            else:
                volatility = 0.2  # Default volatility

            # Generate predictions based on trend
            current_price = prices[-1]
            predictions = []

            for i in range(1, 6):  # Next 5 days
                # Trend-based prediction with volatility adjustment
                trend_prediction = current_price + (trend_slope * i)
                volatility_adjustment = current_price * volatility * np.sqrt(i) * 0.1

                predictions.append(
                    {
                        "period": i,
                        "prediction": float(trend_prediction),
                        "volatility_adjustment": float(volatility_adjustment),
                        "method": f"Trend Day {i}",
                    }
                )

            return {
                "model_name": "Trend Analysis",
                "description": "Simple trend analysis with volatility adjustment",
                "predictions": predictions,
                "accuracy": "Low-Medium",
                "best_for": "Quick trend assessment",
                "metrics": {
                    "trend_slope": float(trend_slope),
                    "volatility": float(volatility),
                },
            }
        except Exception as e:
            logger.warning(f"Trend analysis forecast failed: {str(e)}")
        return None

    def _calculate_confidence_score(
        self, predictions: List[float], current_price: float
    ) -> float:
        """Calculate confidence score based on prediction consistency."""
        try:
            if not predictions:
                return 0.0

            # Calculate coefficient of variation
            mean_pred = np.mean(predictions)
            std_pred = np.std(predictions)
            cv = std_pred / mean_pred if mean_pred > 0 else 1.0

            # Calculate how close predictions are to current price
            price_deviation = np.mean(
                [abs(p - current_price) / current_price for p in predictions]
            )

            # Confidence score (0-100)
            consistency_score = max(0, 100 - (cv * 100))
            price_relevance_score = max(0, 100 - (price_deviation * 100))

            confidence = (consistency_score + price_relevance_score) / 2
            return min(100, max(0, confidence))

        except Exception as e:
            logger.warning(f"Confidence score calculation failed: {str(e)}")
            return 50.0  # Default moderate confidence


# Create global instance
forecasting_service = AdvancedForecastingService()
