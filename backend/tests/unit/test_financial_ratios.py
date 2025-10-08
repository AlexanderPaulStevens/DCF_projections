"""
Financial ratios tests for FinancialRatiosAnalyzer class.
"""

from unittest.mock import Mock, patch

import pytest


class TestFinancialRatiosAnalyzer:
    """Tests for FinancialRatiosAnalyzer class methods."""

    @patch("app.core.financial_ratios.yf.Ticker")
    def test_get_financial_ratios(self, mock_ticker):
        """Test getting financial ratios."""
        from app.core.financial_ratios import FinancialRatiosAnalyzer

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "currentPrice": 150.0,
            "trailingEps": 6.0,
            "bookValue": 4.0,
            "earningsGrowth": 0.1,
            "freeCashflow": 1000000,
            "totalDebt": 500000,
            "totalCash": 200000,
            "sharesOutstanding": 1000000,
        }
        mock_ticker.return_value = mock_ticker_instance

        analyzer = FinancialRatiosAnalyzer("AAPL")
        ratios = analyzer.get_financial_ratios()

        # Check that we get ratios back with expected keys
        assert isinstance(ratios, dict)
        assert "Price-Earnings Ratio" in ratios
        assert "Earnings Yield" in ratios
        assert "Price to Book Ratio" in ratios

    @patch("app.core.financial_ratios.yf.Ticker")
    def test_get_ratios_summary(self, mock_ticker):
        """Test getting ratios summary."""
        from app.core.financial_ratios import FinancialRatiosAnalyzer

        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "currentPrice": 150.0,
            "trailingEps": 6.0,
            "bookValue": 4.0,
        }
        mock_ticker.return_value = mock_ticker_instance

        analyzer = FinancialRatiosAnalyzer("AAPL")
        summary = analyzer.get_ratios_summary()

        # Check that we get ratios back with expected keys
        assert isinstance(summary, dict)
        assert "Price-Earnings Ratio" in summary
        assert "Earnings Yield" in summary
        assert "Price to Book Ratio" in summary
