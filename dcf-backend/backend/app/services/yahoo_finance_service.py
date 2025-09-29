"""
Yahoo Finance service for fetching real-time stock data.
"""

import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

import pandas as pd
import yfinance as yf

logger = logging.getLogger(__name__)


class YahooFinanceService:
    """Service for fetching real-time stock data from Yahoo Finance."""

    def __init__(self):
        self.cache = {}
        self.cache_duration = 300  # 5 minutes cache

    def get_stock_info(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive stock information for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary containing stock information
        """
        try:
            # Check cache first
            cache_key = f"stock_info_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            # Fetch from Yahoo Finance
            stock = yf.Ticker(ticker)
            info = stock.info

            # Extract key information
            stock_data = {
                "ticker": ticker,
                "name": info.get("longName", ticker),
                "current_price": info.get(
                    "currentPrice", info.get("regularMarketPrice", 0)
                ),
                "previous_close": info.get("previousClose", 0),
                "open": info.get("open", 0),
                "day_low": info.get("dayLow", 0),
                "day_high": info.get("dayHigh", 0),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow", 0),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh", 0),
                "volume": info.get("volume", 0),
                "avg_volume": info.get("averageVolume", 0),
                "market_cap": info.get("marketCap", 0),
                "beta": info.get("beta", 0),
                "pe_ratio": info.get("trailingPE", 0),
                "forward_pe": info.get("forwardPE", 0),
                "eps": info.get("trailingEps", 0),
                "forward_eps": info.get("forwardEps", 0),
                "dividend_yield": info.get("dividendYield", 0),
                "ex_dividend_date": self._convert_timestamp(info.get("exDividendDate")),
                "earnings_date": self._convert_timestamp(info.get("earningsDate")),
                "target_price": info.get("targetMeanPrice", 0),
                "recommendation": info.get("recommendationKey", "hold"),
                "currency": info.get("currency", "USD"),
                "exchange": info.get("exchange", ""),
                "sector": info.get("sector", ""),
                "industry": info.get("industry", ""),
                "website": info.get("website", ""),
                "description": info.get("longBusinessSummary", ""),
                "employees": info.get("fullTimeEmployees", 0),
                "city": info.get("city", ""),
                "state": info.get("state", ""),
                "country": info.get("country", ""),
                "last_updated": datetime.now().isoformat(),
            }

            # Calculate price change
            if stock_data["current_price"] and stock_data["previous_close"]:
                price_change = (
                    stock_data["current_price"] - stock_data["previous_close"]
                )
                price_change_percent = (
                    price_change / stock_data["previous_close"]
                ) * 100
                stock_data["price_change"] = round(price_change, 2)
                stock_data["price_change_percent"] = round(price_change_percent, 2)
            else:
                stock_data["price_change"] = 0
                stock_data["price_change_percent"] = 0

            # Cache the result
            self._cache_data(cache_key, stock_data)

            return stock_data

        except Exception as e:
            logger.error(f"Error fetching stock info for {ticker}: {str(e)}")
            return None

    def get_historical_data(
        self, ticker: str, period: str = "1y"
    ) -> Optional[pd.DataFrame]:
        """
        Get historical stock data.

        Args:
            ticker: Stock ticker symbol
            period: Period for historical data (1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max)

        Returns:
            DataFrame with historical data
        """
        try:
            cache_key = f"historical_{ticker}_{period}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)
            hist = stock.history(period=period)

            if hist.empty:
                return None

            # Reset index to make date a column
            hist = hist.reset_index()

            # Cache the result
            self._cache_data(cache_key, hist)

            return hist

        except Exception as e:
            logger.error(f"Error fetching historical data for {ticker}: {str(e)}")
            return None

    def get_dividend_data(self, ticker: str) -> Optional[pd.DataFrame]:
        """
        Get dividend data for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            DataFrame with dividend data
        """
        try:
            cache_key = f"dividends_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)
            dividends = stock.dividends

            if dividends.empty:
                return None

            # Convert to DataFrame
            div_df = dividends.reset_index()
            div_df.columns = ["date", "dividend"]

            # Cache the result
            self._cache_data(cache_key, div_df)

            return div_df

        except Exception as e:
            logger.error(f"Error fetching dividend data for {ticker}: {str(e)}")
            return None

    def get_analyst_recommendations(
        self, ticker: str
    ) -> Optional[List[Dict[str, Any]]]:
        """
        Get analyst recommendations for a ticker.

        Args:
            ticker: Stock ticker symbol

        Returns:
            List of analyst recommendations
        """
        try:
            cache_key = f"recommendations_{ticker}"
            if self._is_cached(cache_key):
                return self.cache[cache_key]["data"]

            stock = yf.Ticker(ticker)
            recommendations = stock.recommendations

            if recommendations is None or recommendations.empty:
                return None

            # Convert to list of dictionaries
            rec_list = recommendations.reset_index().to_dict("records")

            # Cache the result
            self._cache_data(cache_key, rec_list)

            return rec_list

        except Exception as e:
            logger.error(f"Error fetching recommendations for {ticker}: {str(e)}")
            return None

    def _is_cached(self, key: str) -> bool:
        """Check if data is cached and not expired."""
        if key not in self.cache:
            return False

        cache_time = self.cache[key]["timestamp"]
        return (datetime.now() - cache_time).seconds < self.cache_duration

    def _cache_data(self, key: str, data: Any) -> None:
        """Cache data with timestamp."""
        self.cache[key] = {"data": data, "timestamp": datetime.now()}

    def clear_cache(self) -> None:
        """Clear all cached data."""
        self.cache.clear()

    def _convert_timestamp(self, timestamp) -> Optional[str]:
        """Convert timestamp to ISO string format."""
        if timestamp is None:
            return None

        try:
            if isinstance(timestamp, (int, float)):
                # Convert Unix timestamp to datetime
                dt = datetime.fromtimestamp(timestamp)
                return dt.isoformat()
            elif isinstance(timestamp, str):
                # Already a string, return as is
                return timestamp
            else:
                return None
        except (ValueError, TypeError, OSError):
            return None
