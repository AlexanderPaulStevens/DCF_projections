#!/usr/bin/env python3
"""
Unit tests for financial ratios functionality.
"""

from unittest.mock import Mock, patch

from app.core.financial_ratios import FinancialRatiosAnalyzer


class TestFinancialRatiosAnalyzer:
    """Test cases for FinancialRatiosAnalyzer class."""

    def test_init(self):
        """Test FinancialRatiosAnalyzer initialization."""
        analyzer = FinancialRatiosAnalyzer("AAPL")
        assert analyzer.ticker == "AAPL"
        assert analyzer.yf_ticker is not None

    @patch("backend.app.core.financial_ratios.yf.Ticker")
    def test_get_financial_ratios_success(self, mock_yf_ticker):
        """Test successful financial ratios calculation."""
        # Mock Yahoo Finance data
        mock_info = {
            "currentPrice": 150.0,
            "trailingEps": 5.0,
            "bookValue": 10.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 1000000000,
            "sharesOutstanding": 1000000000,
        }

        mock_ticker = Mock()
        mock_ticker.info = mock_info
        mock_yf_ticker.return_value = mock_ticker

        analyzer = FinancialRatiosAnalyzer("AAPL")
        ratios = analyzer.get_financial_ratios()

        assert ratios is not None
        assert "Price-Earnings Ratio" in ratios
        assert "Earnings Yield" in ratios
        assert "Price to Book Ratio" in ratios
        assert "PEG Ratio" in ratios
        assert "Free Cash Flow Yield" in ratios

        # Check calculated values
        assert ratios["Price-Earnings Ratio"] == 30.0  # 150/5
        assert ratios["Earnings Yield"] == 0.03333333333333333  # 5/150
        assert ratios["Price to Book Ratio"] == 15.0  # 150/10
        assert ratios["PEG Ratio"] == 200.0  # 30/0.15

    @patch("backend.app.core.financial_ratios.yf.Ticker")
    def test_get_financial_ratios_missing_data(self, mock_yf_ticker):
        """Test financial ratios calculation with missing data."""
        # Mock incomplete Yahoo Finance data
        mock_info = {
            "currentPrice": None,
            "trailingEps": None,
            "bookValue": None,
            "earningsGrowth": None,
            "freeCashflow": None,
            "sharesOutstanding": None,
        }

        mock_ticker = Mock()
        mock_ticker.info = mock_info
        mock_yf_ticker.return_value = mock_ticker

        analyzer = FinancialRatiosAnalyzer("AAPL")
        ratios = analyzer.get_financial_ratios()

        assert ratios is not None
        assert ratios["Price-Earnings Ratio"] is None
        assert ratios["Earnings Yield"] is None
        assert ratios["Price to Book Ratio"] is None
        assert ratios["PEG Ratio"] is None
        assert ratios["Free Cash Flow Yield"] is None

    @patch("backend.app.core.financial_ratios.yf.Ticker")
    def test_get_financial_ratios_division_by_zero(self, mock_yf_ticker):
        """Test financial ratios calculation with division by zero."""
        # Mock data that would cause division by zero
        mock_info = {
            "currentPrice": 150.0,
            "trailingEps": 0.0,  # This will cause division by zero
            "bookValue": 0.0,  # This will cause division by zero
            "earningsGrowth": 0.0,  # This will cause division by zero
            "freeCashflow": 1000000000,
            "sharesOutstanding": 1000000000,
        }

        mock_ticker = Mock()
        mock_ticker.info = mock_info
        mock_yf_ticker.return_value = mock_ticker

        analyzer = FinancialRatiosAnalyzer("AAPL")
        ratios = analyzer.get_financial_ratios()

        assert ratios is not None
        assert ratios["Price-Earnings Ratio"] is None
        assert ratios["Price to Book Ratio"] is None
        assert ratios["PEG Ratio"] is None

    def test_format_ratio_value_none(self):
        """Test formatting of None values."""
        analyzer = FinancialRatiosAnalyzer("AAPL")
        formatted = analyzer.format_ratio_value(None, "Test Ratio")
        assert formatted == "N/A"

    def test_format_ratio_value_yield(self):
        """Test formatting of yield values."""
        analyzer = FinancialRatiosAnalyzer("AAPL")
        formatted = analyzer.format_ratio_value(0.05, "Earnings Yield")
        assert formatted == "5.00%"

    def test_format_ratio_value_ratio(self):
        """Test formatting of ratio values."""
        analyzer = FinancialRatiosAnalyzer("AAPL")
        formatted = analyzer.format_ratio_value(15.5, "Price-Earnings Ratio")
        assert formatted == "15.50"

    def test_format_ratio_value_other(self):
        """Test formatting of other numeric values."""
        analyzer = FinancialRatiosAnalyzer("AAPL")
        formatted = analyzer.format_ratio_value(25.7, "Other Metric")
        assert formatted == "25.70"

    def test_format_ratio_value_string(self):
        """Test formatting of string values."""
        analyzer = FinancialRatiosAnalyzer("AAPL")
        formatted = analyzer.format_ratio_value("Test String", "Test Metric")
        assert formatted == "Test String"

    @patch("backend.app.core.financial_ratios.yf.Ticker")
    def test_get_ratios_summary(self, mock_yf_ticker):
        """Test getting ratios summary without raw data."""
        # Mock Yahoo Finance data
        mock_info = {
            "currentPrice": 150.0,
            "trailingEps": 5.0,
            "bookValue": 10.0,
            "earningsGrowth": 0.15,
            "freeCashflow": 1000000000,
            "sharesOutstanding": 1000000000,
        }

        mock_ticker = Mock()
        mock_ticker.info = mock_info
        mock_yf_ticker.return_value = mock_ticker

        analyzer = FinancialRatiosAnalyzer("AAPL")
        summary = analyzer.get_ratios_summary()

        assert summary is not None
        assert "_raw_data" not in summary
        assert "Price-Earnings Ratio" in summary
        assert "Earnings Yield" in summary

    @patch("backend.app.core.financial_ratios.yf.Ticker")
    def test_get_ratios_summary_empty(self, mock_yf_ticker):
        """Test getting ratios summary with empty data."""
        # Mock empty Yahoo Finance data
        mock_info = {}

        mock_ticker = Mock()
        mock_ticker.info = mock_info
        mock_yf_ticker.return_value = mock_ticker

        analyzer = FinancialRatiosAnalyzer("AAPL")
        summary = analyzer.get_ratios_summary()

        # When data is empty, ratios will still be created but with None values
        assert summary is not None
        assert len(summary) > 0
        # All ratios should be None when data is missing
        for value in summary.values():
            assert value is None

    @patch("backend.app.core.financial_ratios.yf.Ticker")
    def test_exception_handling(self, mock_yf_ticker):
        """Test exception handling in financial ratios calculation."""
        # Mock Yahoo Finance to raise an exception
        mock_ticker = Mock()
        mock_ticker.info = Mock(side_effect=Exception("API Error"))
        mock_yf_ticker.return_value = mock_ticker

        analyzer = FinancialRatiosAnalyzer("AAPL")
        ratios = analyzer.get_financial_ratios()

        assert ratios == {}

    def test_ticker_validation(self):
        """Test that ticker symbol is properly stored."""
        test_tickers = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"]

        for ticker in test_tickers:
            analyzer = FinancialRatiosAnalyzer(ticker)
            assert analyzer.ticker == ticker
            assert analyzer.yf_ticker is not None


# Test functions for pytest discovery
def test_financial_ratios_analyzer_creation():
    """Test creating a FinancialRatiosAnalyzer instance."""
    analyzer = FinancialRatiosAnalyzer("AAPL")
    assert isinstance(analyzer, FinancialRatiosAnalyzer)
    assert analyzer.ticker == "AAPL"


def test_format_ratio_value_edge_cases():
    """Test edge cases in ratio value formatting."""
    analyzer = FinancialRatiosAnalyzer("AAPL")

    # Test zero values
    assert analyzer.format_ratio_value(0, "Test Ratio") == "0.00"

    # Test negative values
    assert analyzer.format_ratio_value(-5.5, "Test Ratio") == "-5.50"

    # Test very large values
    assert analyzer.format_ratio_value(999999.99, "Test Ratio") == "999999.99"
