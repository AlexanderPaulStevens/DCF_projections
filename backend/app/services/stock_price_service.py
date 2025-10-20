"""
Stock Price Service for real-time price data.

This service fetches current stock prices from Yahoo Finance.
NO backend caching - stock prices are real-time data and should always be fresh.
Frontend handles caching with appropriate stale times (e.g., React Query with 1-minute stale time).
"""

import logging
from datetime import datetime, time
from typing import Any, Dict, Optional

import yfinance as yf

logger = logging.getLogger(__name__)


class StockPriceService:
    """Service for fetching real-time stock price data (no backend caching)."""

    def __init__(self):
        pass  # No dependencies needed

    @staticmethod
    def is_market_open() -> bool:
        """
        Check if US stock market is currently open.

        Returns:
            True if market is open, False otherwise
        """
        now = datetime.now()
        current_time = now.time()
        current_weekday = now.weekday()  # Monday = 0, Sunday = 6

        # Market is closed on weekends
        if current_weekday >= 5:  # Saturday = 5, Sunday = 6
            return False

        # Market hours: 9:30 AM - 4:00 PM ET (simplified)
        market_open = time(9, 30)
        market_close = time(16, 0)

        return market_open <= current_time <= market_close

    def get_stock_price(self, ticker: str) -> Optional[Dict[str, Any]]:
        """
        Get current stock price data (always fresh from Yahoo Finance).

        No backend caching - stock prices are real-time data.
        Frontend should handle caching with appropriate stale times.

        Args:
            ticker: Stock ticker symbol

        Returns:
            Dictionary containing current stock price data
        """
        try:
            logger.info(f"Fetching real-time stock price data for {ticker}")
            stock = yf.Ticker(ticker)

            # Get current price and basic info
            info = stock.info
            hist = stock.history(period="1d", interval="1m")

            if not info or hist.empty:
                logger.warning(f"No stock price data found for {ticker}")
                return None

            # Extract current price data
            current_price = info.get("currentPrice") or info.get("regularMarketPrice")
            previous_close = info.get("previousClose") or info.get("regularMarketPreviousClose")

            # Calculate price change
            price_change = 0
            price_change_percent = 0
            if current_price and previous_close:
                price_change = current_price - previous_close
                price_change_percent = (price_change / previous_close) * 100

            # Get latest volume from historical data
            volume = 0
            if not hist.empty:
                volume = hist["Volume"].iloc[-1] if "Volume" in hist.columns else 0

            # Build stock price data
            return {
                "ticker": ticker.upper(),
                "current_price": current_price or 0,
                "previous_close": previous_close or 0,
                "price_change": round(price_change, 2),
                "price_change_percent": round(price_change_percent, 2),
                "volume": int(volume),
                "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
                "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
                "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
                "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
                "market_cap": info.get("marketCap"),
                "pe_ratio": info.get("trailingPE"),
                "beta": info.get("beta"),
                "last_updated": datetime.now().isoformat(),
                "market_open": self.is_market_open(),
            }

        except Exception as e:
            logger.error(f"Error fetching stock price for {ticker}: {e}")
            return None
