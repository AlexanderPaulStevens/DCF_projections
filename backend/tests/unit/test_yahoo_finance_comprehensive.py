"""
Unit tests for YahooFinanceService comprehensive data functionality.
"""

from datetime import datetime
from unittest.mock import MagicMock, Mock, patch

import pandas as pd
import pytest
from app.services.yahoo_finance_service import YahooFinanceService


class TestYahooFinanceServiceComprehensiveData:
    """Test cases for YahooFinanceService comprehensive data methods."""

    def setup_method(self):
        """Set up test fixtures."""
        self.service = YahooFinanceService()
        self.ticker = "AAPL"

        # Mock comprehensive data
        self.mock_comprehensive_data = {
            "ticker": "AAPL",
            "timestamp": "2024-01-01T12:00:00",
            "current_price": 150.0,
            "previous_close": 148.0,
            "open": 149.0,
            "day_low": 147.0,
            "day_high": 152.0,
            "fifty_two_week_low": 120.0,
            "fifty_two_week_high": 180.0,
            "volume": 1000000,
            "avg_volume": 800000,
            "market_cap": 2500000000000,
            "beta": 1.2,
            "pe_ratio": 25.0,
            "forward_pe": 23.0,
            "eps": 6.0,
            "forward_eps": 6.5,
            "dividend_yield": 0.02,
            "ex_dividend_date": "2024-01-15",
            "earnings_date": "2024-01-25",
            "target_price": 160.0,
            "recommendation": "buy",
            "name": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "description": "Apple Inc. designs, manufactures, and markets smartphones",
            "employees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "book_value": 4.0,
            "earnings_growth": 0.15,
            "free_cashflow": 100000000000,
            "shares_outstanding": 15000000000,
            "total_debt": 100000000000,
            "total_cash": 50000000000,
            "revenue": 400000000000,
            "net_income": 100000000000,
            "historical_data": [
                {
                    "date": "2024-01-01",
                    "open": 149.0,
                    "high": 152.0,
                    "low": 147.0,
                    "close": 150.0,
                    "volume": 1000000,
                }
            ],
            "price_change": 2.0,
            "price_change_percent": 1.35,
        }

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_get_comprehensive_data_success(self, mock_ticker_class):
        """Test successful comprehensive data retrieval."""
        # Mock yfinance Ticker
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker

        # Mock info data
        mock_info = {
            "currentPrice": 150.0,
            "previousClose": 148.0,
            "open": 149.0,
            "dayLow": 147.0,
            "dayHigh": 152.0,
            "fiftyTwoWeekLow": 120.0,
            "fiftyTwoWeekHigh": 180.0,
            "volume": 1000000,
            "averageVolume": 800000,
            "marketCap": 2500000000000,
            "beta": 1.2,
            "trailingPE": 25.0,
            "forwardPE": 23.0,
            "trailingEps": 6.0,
            "forwardEps": 6.5,
            "dividendYield": 0.02,
            "exDividendDate": 1705334400,  # Unix timestamp
            "earningsDate": [1706140800],  # Unix timestamp
            "targetMeanPrice": 160.0,
            "recommendationKey": "buy",
            "longName": "Apple Inc.",
            "currency": "USD",
            "exchange": "NASDAQ",
            "sector": "Technology",
            "industry": "Consumer Electronics",
            "website": "https://apple.com",
            "longBusinessSummary": "Apple Inc. designs, manufactures, and markets smartphones",
            "fullTimeEmployees": 164000,
            "city": "Cupertino",
            "state": "CA",
            "country": "United States",
            "bookValue": 4.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 100000000000,
            "sharesOutstanding": 15000000000,
            "totalDebt": 100000000000,
            "totalCash": 50000000000,
            "totalRevenue": 400000000000,
            "netIncomeToCommon": 100000000000,
        }
        mock_ticker.info = mock_info

        # Mock historical data
        mock_hist_data = pd.DataFrame(
            {
                "Open": [149.0],
                "High": [152.0],
                "Low": [147.0],
                "Close": [150.0],
                "Volume": [1000000],
            },
            index=[pd.Timestamp("2024-01-01")],
        )
        mock_ticker.history.return_value = mock_hist_data

        # Test
        result = self.service.get_comprehensive_data(self.ticker)

        # Assertions
        assert result is not None
        assert result["ticker"] == self.ticker
        assert result["current_price"] == 150.0
        assert result["previous_close"] == 148.0
        assert result["price_change"] == 2.0
        assert result["price_change_percent"] == pytest.approx(1.35, rel=1e-2)
        assert len(result["historical_data"]) == 1
        assert result["historical_data"][0]["date"] == "2024-01-01"

        # Verify Ticker was called correctly
        mock_ticker_class.assert_called_once_with(self.ticker)
        mock_ticker.history.assert_called_once_with(period="1y")

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_get_comprehensive_data_no_data(self, mock_ticker_class):
        """Test comprehensive data retrieval when no data is available."""
        # Mock yfinance Ticker with no data
        mock_ticker = Mock()
        mock_ticker_class.return_value = mock_ticker
        mock_ticker.info = {}
        mock_ticker.history.return_value = pd.DataFrame()  # Empty DataFrame

        # Test
        result = self.service.get_comprehensive_data(self.ticker)

        # Assertions
        assert result is None

    @patch("app.services.yahoo_finance_service.yf.Ticker")
    def test_get_comprehensive_data_exception(self, mock_ticker_class):
        """Test comprehensive data retrieval with exception."""
        # Mock yfinance Ticker to raise exception
        mock_ticker_class.side_effect = Exception("Network error")

        # Test
        result = self.service.get_comprehensive_data(self.ticker)

        # Assertions
        assert result is None

    def test_process_historical_data_success(self):
        """Test successful historical data processing."""
        # Mock historical DataFrame
        hist_data = pd.DataFrame(
            {
                "Open": [149.0, 150.0],
                "High": [152.0, 153.0],
                "Low": [147.0, 148.0],
                "Close": [150.0, 151.0],
                "Volume": [1000000, 1100000],
            },
            index=[pd.Timestamp("2024-01-01"), pd.Timestamp("2024-01-02")],
        )

        # Test
        result = self.service._process_historical_data(hist_data)

        # Assertions
        assert len(result) == 2
        assert result[0]["date"] == "2024-01-01"
        assert result[0]["open"] == 149.0
        assert result[0]["close"] == 150.0
        assert result[0]["volume"] == 1000000
        assert result[1]["date"] == "2024-01-02"
        assert result[1]["open"] == 150.0
        assert result[1]["close"] == 151.0

    def test_process_historical_data_empty(self):
        """Test historical data processing with empty DataFrame."""
        # Empty DataFrame
        hist_data = pd.DataFrame()

        # Test
        result = self.service._process_historical_data(hist_data)

        # Assertions
        assert result == []

    def test_process_historical_data_with_nan(self):
        """Test historical data processing with NaN values."""
        # Mock historical DataFrame with NaN values
        hist_data = pd.DataFrame(
            {
                "Open": [149.0, float("nan")],
                "High": [152.0, 153.0],
                "Low": [147.0, float("nan")],
                "Close": [150.0, 151.0],
                "Volume": [1000000, float("nan")],
            },
            index=[pd.Timestamp("2024-01-01"), pd.Timestamp("2024-01-02")],
        )

        # Test
        result = self.service._process_historical_data(hist_data)

        # Assertions
        assert len(result) == 2
        assert result[0]["open"] == 149.0
        assert result[1]["open"] is None
        assert result[1]["volume"] is None

    def test_caching_behavior(self):
        """Test that comprehensive data is cached properly."""
        with patch("app.services.yahoo_finance_service.yf.Ticker") as mock_ticker_class:
            # Mock successful data retrieval
            mock_ticker = Mock()
            mock_ticker_class.return_value = mock_ticker
            mock_ticker.info = {"currentPrice": 150.0}
            mock_ticker.history.return_value = pd.DataFrame(
                {
                    "Open": [149.0],
                    "High": [152.0],
                    "Low": [147.0],
                    "Close": [150.0],
                    "Volume": [1000000],
                },
                index=[pd.Timestamp("2024-01-01")],
            )

            # First call
            result1 = self.service.get_comprehensive_data(self.ticker)
            assert result1 is not None

            # Second call should use cache
            result2 = self.service.get_comprehensive_data(self.ticker)
            assert result2 is not None
            assert result1 == result2

            # Ticker should only be called once due to caching
            assert mock_ticker_class.call_count == 1

    def test_price_change_calculation(self):
        """Test price change calculation logic."""
        with patch("app.services.yahoo_finance_service.yf.Ticker") as mock_ticker_class:
            mock_ticker = Mock()
            mock_ticker_class.return_value = mock_ticker
            mock_ticker.info = {
                "currentPrice": 150.0,
                "previousClose": 148.0,
            }
            mock_ticker.history.return_value = pd.DataFrame(
                {
                    "Open": [149.0],
                    "High": [152.0],
                    "Low": [147.0],
                    "Close": [150.0],
                    "Volume": [1000000],
                },
                index=[pd.Timestamp("2024-01-01")],
            )

            result = self.service.get_comprehensive_data(self.ticker)

            assert result["price_change"] == 2.0
            assert result["price_change_percent"] == pytest.approx(1.35, rel=1e-2)

    def test_price_change_calculation_zero_previous_close(self):
        """Test price change calculation when previous close is zero."""
        with patch("app.services.yahoo_finance_service.yf.Ticker") as mock_ticker_class:
            mock_ticker = Mock()
            mock_ticker_class.return_value = mock_ticker
            mock_ticker.info = {
                "currentPrice": 150.0,
                "previousClose": 0.0,
            }
            mock_ticker.history.return_value = pd.DataFrame(
                {
                    "Open": [149.0],
                    "High": [152.0],
                    "Low": [147.0],
                    "Close": [150.0],
                    "Volume": [1000000],
                },
                index=[pd.Timestamp("2024-01-01")],
            )

            result = self.service.get_comprehensive_data(self.ticker)

            assert result["price_change"] == 150.0
            assert (
                result["price_change_percent"] == 0.0
            )  # Should be 0 when previous close is 0
