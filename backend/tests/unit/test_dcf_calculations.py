"""
Simplified DCF calculations tests - focused on core functionality.
Tests the pure business logic without external dependencies.
"""

import os
import sys

import pytest

# Add src to Python path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

from app.core.dcf_calculations import DCFCalculator


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

        # Market data that would be provided by YahooFinanceService
        self.market_data = {
            "beta": 1.2,
            "tax_rate": 0.24,
            "market_cap": 1000000000,
            "total_cash": 500000000,
            "shares_outstanding": 1000000000,
        }

    def test_initialization(self):
        """Test DCF calculator initialization with provided data."""
        calculator = DCFCalculator(
            ticker="TEST",
            financial_data=self.sample_data,
            base_year=2023,
            **self.market_data,
        )

        assert calculator.ticker == "TEST"
        assert calculator.base_year == 2023
        assert calculator.financial_data == self.sample_data
        assert calculator.beta == 1.2
        assert calculator.tax_rate == 0.24
        assert calculator.market_cap == 1000000000

    def test_project_financials(self):
        """Test financial projections."""
        calculator = DCFCalculator(
            ticker="TEST",
            financial_data=self.sample_data,
            base_year=2023,
            **self.market_data,
        )
        projections = calculator.project_financials(growth_rate=0.10, years=3)

        assert isinstance(projections, dict)
        assert len(projections) == 3
        assert 2024 in projections
        assert 2025 in projections
        assert 2026 in projections

    def test_calculate_per_share_value(self):
        """Test per share value calculation."""
        calculator = DCFCalculator(
            ticker="TEST",
            financial_data=self.sample_data,
            base_year=2023,
            **self.market_data,
        )
        projections = calculator.project_financials(growth_rate=0.10, years=3)
        enterprise_value = calculator.calculate_enterprise_value(projections)
        equity_value = calculator.calculate_equity_value(enterprise_value)
        per_share_value = calculator.calculate_per_share_value(equity_value)

        assert isinstance(per_share_value, (int, float))
        assert per_share_value > 0

    def test_validation_with_missing_data(self):
        """Test validation with missing required data."""
        # Test with missing revenue data
        incomplete_data = {
            2023: {
                "Net income": 700000,
                "Total Debt": 1000000,
            }
        }

        with pytest.raises(ValueError, match="Missing revenue data"):
            DCFCalculator(
                ticker="TEST",
                financial_data=incomplete_data,
                base_year=2023,
                **self.market_data,
            )

    def test_default_parameters(self):
        """Test that default parameters work correctly."""
        calculator = DCFCalculator(
            ticker="TEST",
            financial_data=self.sample_data,
            base_year=2023,
            # Using all defaults
        )

        assert calculator.beta == 1.0
        assert calculator.tax_rate == 0.24
        assert calculator.market_cap == 0
