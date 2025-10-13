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
from app.schemas.dcf_inputs import DCFFinancialData, DCFMarketData, DCFRatioData


class TestDCFCalculator:
    """Simplified test cases for DCFCalculator class."""

    def setup_method(self):
        """Set up test fixtures."""
        # Standardized financial data (single year, all values in millions)
        self.financial_data = {
            "Revenue": 5000.0,  # $5B in millions
            "EBIT": 600.0,  # $600M in millions
            "Cash and Cash Equivalents": 500.0,
            "Shares Outstanding": 1000.0,  # 1B shares in millions
            "Total Debt": 1000.0,
        }

        # Market data and DCF assumptions
        self.market_data = {
            "beta": 1.2,
            "tax_rate": 0.24,
            "market_cap": 1000.0,  # $1B in millions
            "terminal_growth_rate": 0.025,  # 2.5%
            "market_risk_premium": 0.055,  # 5.5%
            "risk_free_rate": 0.045,  # 4.5%
        }

        # Operating ratios
        self.ratio_data = {
            "wc_to_revenue_ratio": 0.05,  # 5%
            "capex_to_revenue_ratio": 0.05,  # 5%
            "da_to_revenue_ratio": 0.035,  # 3.5%
        }

    def test_initialization(self):
        """Test DCF calculator initialization with provided data."""
        # Create validated Pydantic models
        financial_data = DCFFinancialData(**self.financial_data)
        market_data = DCFMarketData(**self.market_data)
        ratio_data = DCFRatioData(**self.ratio_data)

        calculator = DCFCalculator(
            ticker="TEST",
            financial_data=financial_data,
            market_data=market_data,
            ratio_data=ratio_data,
        )

        assert calculator.ticker == "TEST"
        assert calculator.beta == 1.2
        assert calculator.tax_rate == 0.24
        assert calculator.market_cap == 1000.0
        assert calculator.cash == 500.0
        assert calculator.shares_outstanding_mm == 1000.0
        assert calculator.total_debt == 1000.0
        assert calculator.terminal_growth_rate == 0.025
        assert calculator.risk_free_rate == 0.045
        assert calculator.capex_to_revenue_ratio == 0.05

    def test_project_financials(self):
        """Test financial projections."""
        # Create validated Pydantic models
        financial_data = DCFFinancialData(**self.financial_data)
        market_data = DCFMarketData(**self.market_data)
        ratio_data = DCFRatioData(**self.ratio_data)

        calculator = DCFCalculator(
            ticker="TEST",
            financial_data=financial_data,
            market_data=market_data,
            ratio_data=ratio_data,
        )
        # Set base year for projection calculations
        calculator.base_year = 2023

        projections = calculator.project_financials(years=3, annual_growth_rate=0.10)

        assert isinstance(projections, dict)
        assert len(projections) == 3
        assert 2024 in projections
        assert 2025 in projections
        assert 2026 in projections
        # Verify constant growth rate
        assert projections[2024]["Growth_Rate"] == 0.10
        assert projections[2025]["Growth_Rate"] == 0.10
        assert projections[2026]["Growth_Rate"] == 0.10

    def test_calculate_per_share_value(self):
        """Test per share value calculation."""
        # Create validated Pydantic models
        financial_data = DCFFinancialData(**self.financial_data)
        market_data = DCFMarketData(**self.market_data)
        ratio_data = DCFRatioData(**self.ratio_data)

        calculator = DCFCalculator(
            ticker="TEST",
            financial_data=financial_data,
            market_data=market_data,
            ratio_data=ratio_data,
        )
        calculator.base_year = 2023

        projections = calculator.project_financials(years=3, annual_growth_rate=0.10)
        enterprise_value = calculator.calculate_enterprise_value(projections)
        equity_value = calculator.calculate_equity_value(enterprise_value)
        per_share_value = calculator.calculate_per_share_value(equity_value)

        assert isinstance(per_share_value, (int, float))
        assert per_share_value > 0

    def test_validation_with_missing_data(self):
        """Test Pydantic validation with missing required data."""
        # Test with missing revenue data - Pydantic should raise ValidationError
        incomplete_data = {
            "EBIT": 600.0,
            "Cash and Cash Equivalents": 500.0,
            # Missing Revenue and Shares Outstanding
        }

        # Pydantic should raise ValidationError when creating the model
        with pytest.raises(Exception):  # Pydantic raises ValidationError
            DCFFinancialData(**incomplete_data)
