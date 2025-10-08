"""
Simplified DCF calculations tests - focused on core functionality.
"""

import os
import sys
from unittest.mock import Mock, patch

import pytest

# Add src to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from app.core.DCF_calculations import DCFCalculator


class TestDCFCalculator:
    """Simplified test cases for DCFCalculator class."""

    def setup_method(self):
        """Set up test fixtures."""
        self.sample_data = {
            2023: {
                "Total net sales": 5000000,
                "Operating Income": 600000,  # Added EBIT/Operating Income
                "Net income": 700000,
                "Total Debt": 1000000,
                "Cash and Cash Equivalents": 500000,
                "Shares Outstanding": 1000000,
            }
        }

    @patch("app.core.DCF_calculations.yf.Ticker")
    def test_initialization(self, mock_ticker):
        """Test DCF calculator initialization."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "currentPrice": 100,
            "marketCap": 1000000000,
            "beta": 1.2,
        }
        mock_ticker.return_value = mock_ticker_instance

        calculator = DCFCalculator("TEST", self.sample_data, 2023)

        assert calculator.ticker == "TEST"
        assert calculator.base_year == 2023
        assert calculator.financial_data == self.sample_data

    @patch("app.core.DCF_calculations.yf.Ticker")
    def test_project_financials(self, mock_ticker):
        """Test financial projections."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "currentPrice": 100,
            "marketCap": 1000000000,
            "beta": 1.2,
        }
        mock_ticker.return_value = mock_ticker_instance

        calculator = DCFCalculator("TEST", self.sample_data, 2023)
        projections = calculator.project_financials(growth_rate=0.10, years=3)

        assert isinstance(projections, dict)
        assert len(projections) == 3
        assert 2024 in projections
        assert 2025 in projections
        assert 2026 in projections

    @patch("app.core.DCF_calculations.yf.Ticker")
    def test_calculate_per_share_value(self, mock_ticker):
        """Test per share value calculation."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "currentPrice": 100,
            "marketCap": 1000000000,
            "beta": 1.2,
        }
        mock_ticker.return_value = mock_ticker_instance

        calculator = DCFCalculator("TEST", self.sample_data, 2023)
        projections = calculator.project_financials(growth_rate=0.10, years=3)
        enterprise_value = calculator.calculate_enterprise_value(projections)
        equity_value = calculator.calculate_equity_value(enterprise_value)
        per_share_value = calculator.calculate_per_share_value(equity_value)

        assert isinstance(per_share_value, (int, float))
        assert per_share_value > 0

    @patch("app.core.DCF_calculations.yf.Ticker")
    def test_validation_with_missing_data(self, mock_ticker):
        """Test validation with missing required data."""
        mock_ticker_instance = Mock()
        mock_ticker_instance.info = {
            "currentPrice": 100,
            "marketCap": 1000000000,
            "beta": 1.2,
        }
        mock_ticker.return_value = mock_ticker_instance

        # Test with missing revenue data
        incomplete_data = {
            2023: {
                "Net income": 700000,
                "Total Debt": 1000000,
            }
        }

        with pytest.raises(ValueError, match="Missing revenue data"):
            DCFCalculator("TEST", incomplete_data, 2023)
