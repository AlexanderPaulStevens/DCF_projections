"""
Historical Data Service - Dedicated service for stock price history
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class HistoricalDataService:
    """Dedicated service for fetching and managing historical stock data."""

    def __init__(self):
        self.cache = {}
        self.cache_duration = 300  # 5 minutes

    def get_historical_data(
        self, ticker: str, period: str = "6mo"
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get historical price data for a specific period.

        Args:
            ticker: Stock ticker symbol
            period: Time period (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

        Returns:
            List of historical data points with date, open, high, low, close, volume
        """
        try:
            cache_key = f"historical_data_{ticker}_{period}"
            if self._is_cached(cache_key):
                logger.debug(f"Retrieved cached historical data for {ticker} ({period})")
                return self.cache[cache_key]["data"]

            logger.info(f"Fetching historical data for {ticker} ({period})")
            stock = yf.Ticker(ticker)

            # Get historical data with appropriate interval based on period
            interval = self._get_interval_for_period(period)
            hist_df = stock.history(period=period, interval=interval)

            if hist_df.empty:
                logger.warning(f"No historical data found for {ticker} ({period})")
                return None

            # Process the data
            historical_data = self._process_historical_data(hist_df)

            # Cache the result
            self._cache_data(cache_key, historical_data)

            logger.info(
                f"Successfully fetched {len(historical_data)} data points for {ticker} ({period})"
            )
            return historical_data

        except Exception as e:
            logger.error(f"Error fetching historical data for {ticker} ({period}): {e}")
            return None

    def get_multiple_periods(
        self, ticker: str, periods: List[str]
    ) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get historical data for multiple periods at once.

        Args:
            ticker: Stock ticker symbol
            periods: List of time periods

        Returns:
            Dictionary mapping period to historical data
        """
        result = {}
        for period in periods:
            data = self.get_historical_data(ticker, period)
            if data:
                result[period] = data
        return result

    def _get_interval_for_period(self, period: str) -> str:
        """Determine the appropriate interval based on the period."""
        if period in ["1d", "5d"]:
            return "1m"  # 1 minute intervals for intraday
        elif period in ["1mo", "3mo"]:
            return "1d"  # Daily intervals
        elif period in ["6mo", "1y", "2y"]:
            return "1d"  # Daily intervals
        elif period in ["5y", "10y", "ytd", "max"]:
            return "1d"  # Daily intervals
        else:
            return "1d"  # Default to daily

    def _process_historical_data(self, hist_df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Process historical data DataFrame into list of dictionaries."""
        try:
            historical_data = []
            for date, row in hist_df.iterrows():
                historical_data.append(
                    {
                        "date": date.strftime("%Y-%m-%d"),
                        "open": float(row["Open"]),
                        "high": float(row["High"]),
                        "low": float(row["Low"]),
                        "close": float(row["Close"]),
                        "volume": int(row["Volume"]),
                    }
                )
            return historical_data
        except Exception as e:
            logger.error(f"Error processing historical data: {e}")
            return []

    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and still valid."""
        if key not in self.cache:
            return False

        cache_time = self.cache[key]["timestamp"]
        age = datetime.now() - cache_time
        return age.total_seconds() < self.cache_duration

    def _cache_data(self, key: str, data: Any) -> None:
        """Cache data with timestamp."""
        self.cache[key] = {"data": data, "timestamp": datetime.now()}
