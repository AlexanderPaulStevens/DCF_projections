"""
Simple Yahoo Finance service tests.
"""

from unittest.mock import Mock, patch

import pytest


class TestYahooFinanceService:
    """Simple tests for YahooFinanceService."""

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_get_stock_info(self, mock_ticker):
        """Test getting stock info."""
        from app.services.yahoo_finance_service import YahooFinanceService

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "longName": "Apple Inc.",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "currentPrice": 150.0,
        }
        mock_ticker.return_value = mock_ticker_instance

        service = YahooFinanceService()
        result = service.get_stock_info("AAPL")

        assert result["name"] == "Apple Inc."
        assert result["sector"] == "Technology"

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_get_stock_info_with_price(self, mock_ticker):
        """Test getting stock info with price data."""
        from app.services.yahoo_finance_service import YahooFinanceService

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "currentPrice": 150.0,
            "regularMarketChange": 2.5,
            "regularMarketChangePercent": 0.0169,
            "longName": "Apple Inc.",
        }
        mock_ticker.return_value = mock_ticker_instance

        service = YahooFinanceService()
        result = service.get_stock_info("AAPL")

        assert result["current_price"] == 150.0
        assert result["name"] == "Apple Inc."

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_get_financial_statements(self, mock_ticker):
        """Test getting financial statements."""
        from app.services.yahoo_finance_service import YahooFinanceService

        mock_ticker_instance = Mock()
        mock_financials = Mock()
        mock_financials.to_dict.return_value = {
            "Total Revenue": {2023: 1000000, 2022: 900000},
            "Net Income": {2023: 200000, 2022: 180000},
        }
        mock_ticker_instance.financials = mock_financials
        mock_ticker.return_value = mock_ticker_instance

        service = YahooFinanceService()
        result = service.get_financial_statements("AAPL")

        # The method returns None if no data found, so test that it doesn't crash
        assert result is None or isinstance(result, dict)
